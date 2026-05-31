#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <optional>
#include <string>
#include <sched.h>
#include <unistd.h>
#include <sys/syscall.h>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <ctime>
#include <vector>

#include <httplib.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// ---------------------------------------------------------------------------
// CPU affinity and system helpers
// ---------------------------------------------------------------------------

static int get_available_cores() {
#ifdef __linux__
  long n = sysconf(_SC_NPROCESSORS_ONLN);
  return n > 0 ? static_cast<int>(n) : 1;
#else
  return 1;
#endif
}

static bool set_cpu_affinity(int core) {
#ifdef __linux__
  cpu_set_t cpuset;
  CPU_ZERO(&cpuset);
  CPU_SET(core, &cpuset);
  return sched_setaffinity(0, sizeof(cpu_set_t), &cpuset) == 0;
#else
  (void)core;
  return false;
#endif
}

static long get_thread_id() {
#ifdef __linux__
  return static_cast<long>(syscall(SYS_gettid));
#else
  return -1;
#endif
}

static int get_core_id() {
#ifdef __linux__
  return sched_getcpu();
#else
  return -1;
#endif
}

static long get_peak_memory_kb() {
#ifdef __linux__
  std::ifstream status("/proc/self/status");
  if (!status.is_open()) return -1;
  std::string line;
  while (std::getline(status, line)) {
    if (line.rfind("VmHWM:", 0) == 0) {
      std::istringstream iss(line);
      std::string label;
      long value;
      std::string unit;
      if (iss >> label >> value >> unit) {
        return value;
      }
    }
  }
#endif
  return -1;
}

static std::string get_current_timestamp() {
  auto now = std::time(nullptr);
  auto* tm = std::gmtime(&now);
  if (!tm) return "unknown";
  std::ostringstream oss;
  oss << std::put_time(tm, "%Y-%m-%dT%H:%M:%SZ");
  return oss.str();
}

// ---------------------------------------------------------------------------
// Step capture – mirrors Python's capture_step
// ---------------------------------------------------------------------------

static void capture_step(std::vector<std::vector<int>>& steps,
                          const std::vector<int>& values) {
  if (values.size() <= 80 && steps.size() < 80) {
    steps.push_back(values);
  }
}

// ---------------------------------------------------------------------------
// Algorithm implementations
// ---------------------------------------------------------------------------

struct SortResult {
  std::vector<int> sorted;
  int comparisons;
  std::vector<std::vector<int>> steps;
};

SortResult bubble_sort(const std::vector<int>& data) {
  std::vector<int> arr = data;
  int comparisons = 0;
  std::vector<std::vector<int>> steps;
  capture_step(steps, arr);

  for (size_t i = 0; i < arr.size(); ++i) {
    bool swapped = false;
    for (size_t j = 0; j < arr.size() - i - 1; ++j) {
      ++comparisons;
      if (arr[j] > arr[j + 1]) {
        std::swap(arr[j], arr[j + 1]);
        swapped = true;
        capture_step(steps, arr);
      }
    }
    if (!swapped) break;
  }
  return {arr, comparisons, steps};
}

SortResult selection_sort(const std::vector<int>& data) {
  std::vector<int> arr = data;
  int comparisons = 0;
  std::vector<std::vector<int>> steps;
  capture_step(steps, arr);

  for (size_t i = 0; i < arr.size(); ++i) {
    size_t min_idx = i;
    for (size_t j = i + 1; j < arr.size(); ++j) {
      ++comparisons;
      if (arr[j] < arr[min_idx]) {
        min_idx = j;
      }
    }
    if (min_idx != i) {
      std::swap(arr[i], arr[min_idx]);
      capture_step(steps, arr);
    }
  }
  return {arr, comparisons, steps};
}

SortResult insertion_sort(const std::vector<int>& data) {
  std::vector<int> arr = data;
  int comparisons = 0;
  std::vector<std::vector<int>> steps;
  capture_step(steps, arr);

  for (size_t i = 1; i < arr.size(); ++i) {
    int key = arr[i];
    int j = static_cast<int>(i) - 1;
    while (j >= 0) {
      ++comparisons;
      if (arr[j] <= key) break;
      arr[j + 1] = arr[j];
      --j;
    }
    arr[j + 1] = key;
    capture_step(steps, arr);
  }
  return {arr, comparisons, steps};
}

struct MergeContext {
  int comparisons;
  std::vector<std::vector<int>> steps;
};

static std::vector<int> merge_sort_impl(const std::vector<int>& values,
                                         MergeContext& ctx) {
  if (values.size() <= 1) return values;

  size_t mid = values.size() / 2;
  std::vector<int> left =
      merge_sort_impl({values.begin(), values.begin() + mid}, ctx);
  std::vector<int> right =
      merge_sort_impl({values.begin() + mid, values.end()}, ctx);

  std::vector<int> merged;
  merged.reserve(left.size() + right.size());
  size_t i = 0, j = 0;

  while (i < left.size() && j < right.size()) {
    ++ctx.comparisons;
    if (left[i] <= right[j]) {
      merged.push_back(left[i]);
      ++i;
    } else {
      merged.push_back(right[j]);
      ++j;
    }
  }
  merged.insert(merged.end(), left.begin() + i, left.end());
  merged.insert(merged.end(), right.begin() + j, right.end());

  capture_step(ctx.steps, merged);
  return merged;
}

SortResult merge_sort(const std::vector<int>& data) {
  MergeContext ctx{0, {}};
  std::vector<int> sorted = merge_sort_impl(data, ctx);
  return {sorted, ctx.comparisons, ctx.steps};
}

SortResult quick_sort(const std::vector<int>& data) {
  std::vector<int> arr = data;
  int comparisons = 0;
  std::vector<std::vector<int>> steps;
  capture_step(steps, arr);

  std::function<void(int64_t, int64_t)> sort_impl;
  sort_impl = [&](int64_t low, int64_t high) {
    if (low >= high) return;

    // median-of-three pivot
    int64_t mid = (low + high) / 2;
    std::swap(arr[mid], arr[high]);
    int pivot = arr[high];

    int64_t i = low;
    for (int64_t j = low; j < high; ++j) {
      ++comparisons;
      if (arr[j] <= pivot) {
        std::swap(arr[i], arr[j]);
        ++i;
      }
    }
    std::swap(arr[i], arr[high]);
    capture_step(steps, arr);

    // sort the smaller partition first (tail-call optimisation)
    if (i - low < high - i) {
      sort_impl(low, i - 1);
      sort_impl(i + 1, high);
    } else {
      sort_impl(i + 1, high);
      sort_impl(low, i - 1);
    }
  };

  if (!arr.empty()) sort_impl(0, static_cast<int64_t>(arr.size()) - 1);
  return {arr, comparisons, steps};
}

// ---------------------------------------------------------------------------
// Search algorithms
// ---------------------------------------------------------------------------

struct SearchResult {
  std::vector<int> data;
  int comparisons;
  std::optional<int> foundIndex;
};

SearchResult linear_search(const std::vector<int>& data,
                            std::optional<int> target) {
  int t = target.value_or(data.empty() ? 0 : data.back());
  int comparisons = 0;

  for (size_t idx = 0; idx < data.size(); ++idx) {
    ++comparisons;
    if (data[idx] == t) {
      return {data, comparisons, static_cast<int>(idx)};
    }
  }
  return {data, comparisons, std::nullopt};
}

SearchResult binary_search(const std::vector<int>& data,
                            std::optional<int> target) {
  std::vector<int> sorted = data;
  std::sort(sorted.begin(), sorted.end());

  if (sorted.empty()) return {sorted, 0, std::nullopt};

  int t = target.value_or(sorted[sorted.size() / 2]);
  int comparisons = 0;
  int64_t low = 0;
  int64_t high = static_cast<int64_t>(sorted.size()) - 1;

  while (low <= high) {
    int64_t mid = (low + high) / 2;
    ++comparisons;
    if (sorted[mid] == t) {
      return {sorted, comparisons, static_cast<int>(mid)};
    }
    if (sorted[mid] < t) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return {sorted, comparisons, std::nullopt};
}

// ---------------------------------------------------------------------------
// Request/Response helpers
// ---------------------------------------------------------------------------

struct AlgorithmRequest {
  std::string algorithm;
  std::vector<int> data;
  std::string type;
  std::optional<int> target;
  std::optional<int> cpuCore;
};

static void from_json(const json& j, AlgorithmRequest& r) {
  j.at("algorithm").get_to(r.algorithm);
  j.at("data").get_to(r.data);
  r.type = j.value("type", std::string("random"));
  if (j.contains("target") && !j["target"].is_null()) {
    r.target = j["target"].get<int>();
  } else {
    r.target = std::nullopt;
  }
  if (j.contains("cpuCore") && !j["cpuCore"].is_null()) {
    r.cpuCore = j["cpuCore"].get<int>();
  } else {
    r.cpuCore = std::nullopt;
  }
}

static json make_error_response(const std::string& detail, int status) {
  json j = {{"detail", detail}};
  return j;
}

static json make_health_response() {
  return {{"status", "AlgoVista backend running"}};
}

static json make_algorithm_response(
    const std::string& algorithm, const std::vector<int>& data,
    const std::string& type, std::optional<int> target,
    double elapsed_ms,
    const std::vector<int>& sorted_data, int comparisons,
    std::optional<int> found_index,
    const std::vector<std::vector<int>>& steps,
    int cpu_core, bool affinity_enabled, int available_cores,
    long thread_id, int core_id, long peak_memory_kb,
    const std::string& timestamp) {

  elapsed_ms = std::round(elapsed_ms * 10000.0) / 10000.0;

  // truncate sorted data to 1000 (matching Python backend)
  std::vector<int> truncated =
      sorted_data.size() > 1000
          ? std::vector<int>(sorted_data.begin(), sorted_data.begin() + 1000)
          : sorted_data;

  json j;
  j["timeMs"] = elapsed_ms;
  j["comparisons"] = comparisons;
  j["sortedData"] = truncated;
  j["algorithm"] = algorithm;
  j["inputSize"] = static_cast<int>(data.size());
  j["datasetType"] = type;
  j["target"] = target ? json(*target) : json(nullptr);
  j["foundIndex"] = found_index ? json(*found_index) : json(nullptr);
  j["steps"] = steps;
  j["cpuCore"] = cpu_core;
  j["cpuAffinityEnabled"] = affinity_enabled;
  j["availableCores"] = available_cores;
  j["threadId"] = thread_id;
  j["coreId"] = core_id;
  j["peakMemoryKB"] = peak_memory_kb;
  j["benchmarkTimestamp"] = timestamp;
  return j;
}

// ---------------------------------------------------------------------------
// main – HTTP server
// ---------------------------------------------------------------------------

int main(int argc, char* argv[]) {
  int affinity_core = 0;
  if (argc > 1) {
    affinity_core = std::atoi(argv[1]);
    if (affinity_core < 0) affinity_core = 0;
  }
  bool pinned = set_cpu_affinity(affinity_core);
  std::cout << "CPU affinity: core " << affinity_core
            << (pinned ? " [OK]" : " [FAIL]") << std::endl;

  httplib::Server svr;

  // CORS – set headers on every response via a hook
  svr.set_pre_routing_handler([](const httplib::Request& req,
                                  httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods",
                   "GET, POST, OPTIONS, PUT, DELETE");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set_header("Access-Control-Allow-Credentials", "true");

    if (req.method == "OPTIONS") {
      res.status = 204;
      return httplib::Server::HandlerResponse::Handled;
    }
    return httplib::Server::HandlerResponse::Unhandled;
  });

  // GET /
  svr.Get("/", [](const httplib::Request&, httplib::Response& res) {
    res.set_content(make_health_response().dump(), "application/json");
  });

  // POST /run-algorithm
  svr.Post("/run-algorithm", [](const httplib::Request& req,
                                 httplib::Response& res) {
    try {
      json body = json::parse(req.body);
      AlgorithmRequest payload = body.get<AlgorithmRequest>();

      if (payload.data.empty()) {
        res.status = 400;
        res.set_content(
            make_error_response("Data array cannot be empty.", 400).dump(),
            "application/json");
        return;
      }

      // --- CPU affinity setup ---
      int available_cores = get_available_cores();
      int cpu_core = payload.cpuCore.value_or(0);
      if (cpu_core < 0 || cpu_core >= available_cores) {
        cpu_core = 0;
      }
      bool affinity_enabled = set_cpu_affinity(cpu_core);

      // --- Validate algorithm ---
      bool algo_valid = (payload.algorithm == "bubble_sort" ||
                         payload.algorithm == "selection_sort" ||
                         payload.algorithm == "insertion_sort" ||
                         payload.algorithm == "merge_sort" ||
                         payload.algorithm == "quick_sort" ||
                         payload.algorithm == "linear_search" ||
                         payload.algorithm == "binary_search");
      if (!algo_valid) {
        res.status = 400;
        res.set_content(
            make_error_response("Unsupported algorithm.", 400).dump(),
            "application/json");
        return;
      }

      // --- Algorithm dispatch lambda (shared by warm-up and timed run) ---
      auto run_algo = [&]() -> std::tuple<std::vector<int>, int,
                                          std::optional<int>,
                                          std::vector<std::vector<int>>> {
        if (payload.algorithm == "bubble_sort") {
          auto r = bubble_sort(payload.data);
          return {r.sorted, r.comparisons, std::nullopt, r.steps};
        } else if (payload.algorithm == "selection_sort") {
          auto r = selection_sort(payload.data);
          return {r.sorted, r.comparisons, std::nullopt, r.steps};
        } else if (payload.algorithm == "insertion_sort") {
          auto r = insertion_sort(payload.data);
          return {r.sorted, r.comparisons, std::nullopt, r.steps};
        } else if (payload.algorithm == "merge_sort") {
          auto r = merge_sort(payload.data);
          return {r.sorted, r.comparisons, std::nullopt, r.steps};
        } else if (payload.algorithm == "quick_sort") {
          auto r = quick_sort(payload.data);
          return {r.sorted, r.comparisons, std::nullopt, r.steps};
        } else if (payload.algorithm == "linear_search") {
          auto r = linear_search(payload.data, payload.target);
          return {r.data, r.comparisons, r.foundIndex, {}};
        } else if (payload.algorithm == "binary_search") {
          auto r = binary_search(payload.data, payload.target);
          return {r.data, r.comparisons, r.foundIndex, {}};
        }
        return {{}, 0, std::nullopt, {}};
      };

      // --- Warm-up run (result discarded) ---
      run_algo();

      // --- Timed execution ---
      auto start = std::chrono::high_resolution_clock::now();
      auto [sorted_data, comparisons, found_index, steps] = run_algo();
      auto end = std::chrono::high_resolution_clock::now();
      double elapsed_ms =
          std::chrono::duration<double, std::milli>(end - start).count();

      // --- Collect optional performance metrics ---
      long thread_id = get_thread_id();
      int core_id = get_core_id();
      long peak_memory_kb = get_peak_memory_kb();
      std::string timestamp = get_current_timestamp();

      json response = make_algorithm_response(
          payload.algorithm, payload.data, payload.type, payload.target,
          elapsed_ms, sorted_data, comparisons, found_index, steps,
          cpu_core, affinity_enabled, available_cores,
          thread_id, core_id, peak_memory_kb, timestamp);

      res.set_content(response.dump(), "application/json");

    } catch (const json::exception& e) {
      res.status = 400;
      res.set_content(
          make_error_response(std::string("Invalid JSON: ") + e.what(), 400)
              .dump(),
          "application/json");
    }
  });

  std::cout << "AlgoVista C++ backend running on http://0.0.0.0:8000"
            << std::endl;
  svr.listen("0.0.0.0", 8000);
  return 0;
}

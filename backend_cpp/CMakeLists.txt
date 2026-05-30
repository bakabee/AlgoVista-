cmake_minimum_required(VERSION 3.20)
project(algovista_backend LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)

FetchContent_Declare(
  cpp-httplib
  GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
  GIT_TAG v0.18.2
)
FetchContent_MakeAvailable(cpp-httplib)

FetchContent_Declare(
  nlohmann_json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG v3.11.3
)
FetchContent_MakeAvailable(nlohmann_json)

add_executable(algovista_backend src/main.cpp)
target_link_libraries(algovista_backend PRIVATE httplib::httplib nlohmann_json::nlohmann_json)

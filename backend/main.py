from __future__ import annotations

from time import perf_counter
from typing import Callable, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


Algorithm = Literal[
    "bubble_sort",
    "selection_sort",
    "insertion_sort",
    "merge_sort",
    "quick_sort",
    "linear_search",
    "binary_search",
]


class AlgorithmRequest(BaseModel):
    algorithm: Algorithm
    data: list[int] = Field(default_factory=list)
    type: str = "random"
    target: int | None = None


class AlgorithmResponse(BaseModel):
    timeMs: float
    comparisons: int
    sortedData: list[int]
    algorithm: str
    inputSize: int
    datasetType: str
    target: int | None = None
    foundIndex: int | None = None
    steps: list[list[int]] = Field(default_factory=list)


app = FastAPI(title="AlgoVista API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def capture_step(steps: list[list[int]], values: list[int]) -> None:
    if len(values) <= 80 and len(steps) < 80:
        steps.append(values.copy())


def bubble_sort(data: list[int]) -> tuple[list[int], int, list[list[int]]]:
    arr = data.copy()
    comparisons = 0
    steps: list[list[int]] = []
    capture_step(steps, arr)

    for i in range(len(arr)):
        swapped = False
        for j in range(0, len(arr) - i - 1):
            comparisons += 1
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
                capture_step(steps, arr)
        if not swapped:
            break
    return arr, comparisons, steps


def selection_sort(data: list[int]) -> tuple[list[int], int, list[list[int]]]:
    arr = data.copy()
    comparisons = 0
    steps: list[list[int]] = []
    capture_step(steps, arr)

    for i in range(len(arr)):
        min_idx = i
        for j in range(i + 1, len(arr)):
            comparisons += 1
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
            capture_step(steps, arr)
    return arr, comparisons, steps


def insertion_sort(data: list[int]) -> tuple[list[int], int, list[list[int]]]:
    arr = data.copy()
    comparisons = 0
    steps: list[list[int]] = []
    capture_step(steps, arr)

    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0:
            comparisons += 1
            if arr[j] <= key:
                break
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
        capture_step(steps, arr)
    return arr, comparisons, steps


def merge_sort(data: list[int]) -> tuple[list[int], int, list[list[int]]]:
    steps: list[list[int]] = []
    comparisons = 0

    def sort(values: list[int]) -> list[int]:
        nonlocal comparisons
        if len(values) <= 1:
            return values

        mid = len(values) // 2
        left = sort(values[:mid])
        right = sort(values[mid:])
        merged: list[int] = []
        i = j = 0

        while i < len(left) and j < len(right):
            comparisons += 1
            if left[i] <= right[j]:
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                j += 1

        merged.extend(left[i:])
        merged.extend(right[j:])
        capture_step(steps, merged)
        return merged

    sorted_data = sort(data.copy())
    return sorted_data, comparisons, steps


def quick_sort(data: list[int]) -> tuple[list[int], int, list[list[int]]]:
    arr = data.copy()
    comparisons = 0
    steps: list[list[int]] = []
    capture_step(steps, arr)

    def partition(low: int, high: int) -> int:
        nonlocal comparisons
        mid = (low + high) // 2
        arr[mid], arr[high] = arr[high], arr[mid]
        pivot = arr[high]
        i = low
        for j in range(low, high):
            comparisons += 1
            if arr[j] <= pivot:
                arr[i], arr[j] = arr[j], arr[i]
                i += 1
        arr[i], arr[high] = arr[high], arr[i]
        capture_step(steps, arr)
        return i

    def sort(low: int, high: int) -> None:
        if low < high:
            pivot_idx = partition(low, high)
            if pivot_idx - low < high - pivot_idx:
                sort(low, pivot_idx - 1)
                sort(pivot_idx + 1, high)
            else:
                sort(pivot_idx + 1, high)
                sort(low, pivot_idx - 1)

    sort(0, len(arr) - 1)
    return arr, comparisons, steps


def linear_search(data: list[int], target: int | None) -> tuple[list[int], int, int | None]:
    comparisons = 0
    if target is None:
        target = data[-1] if data else None

    for index, value in enumerate(data):
        comparisons += 1
        if value == target:
            return data.copy(), comparisons, index
    return data.copy(), comparisons, None


def binary_search(data: list[int], target: int | None) -> tuple[list[int], int, int | None]:
    arr = sorted(data)
    comparisons = 0
    if target is None:
        target = arr[len(arr) // 2] if arr else None

    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        comparisons += 1
        if arr[mid] == target:
            return arr, comparisons, mid
        if arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return arr, comparisons, None


SORTERS: dict[str, Callable[[list[int]], tuple[list[int], int, list[list[int]]]]] = {
    "bubble_sort": bubble_sort,
    "selection_sort": selection_sort,
    "insertion_sort": insertion_sort,
    "merge_sort": merge_sort,
    "quick_sort": quick_sort,
}


@app.get("/")
def health() -> dict[str, str]:
    return {"status": "AlgoVista backend running"}


@app.post("/run-algorithm", response_model=AlgorithmResponse)
def run_algorithm(payload: AlgorithmRequest) -> AlgorithmResponse:
    if not payload.data:
        raise HTTPException(status_code=400, detail="Data array cannot be empty.")

    started = perf_counter()
    found_index: int | None = None
    steps: list[list[int]] = []
    target = payload.target

    if payload.algorithm in SORTERS:
        sorted_data, comparisons, steps = SORTERS[payload.algorithm](payload.data)
    elif payload.algorithm == "linear_search":
        sorted_data, comparisons, found_index = linear_search(payload.data, target)
    elif payload.algorithm == "binary_search":
        sorted_data, comparisons, found_index = binary_search(payload.data, target)
    else:
        raise HTTPException(status_code=400, detail="Unsupported algorithm.")

    elapsed_ms = (perf_counter() - started) * 1000
    return AlgorithmResponse(
        timeMs=round(elapsed_ms, 4),
        comparisons=comparisons,
        sortedData=sorted_data[:1000],
        algorithm=payload.algorithm,
        inputSize=len(payload.data),
        datasetType=payload.type,
        target=target,
        foundIndex=found_index,
        steps=steps,
    )

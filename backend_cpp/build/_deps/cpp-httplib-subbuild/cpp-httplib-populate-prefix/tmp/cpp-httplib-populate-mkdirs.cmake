# Distributed under the OSI-approved BSD 3-Clause License.  See accompanying
# file Copyright.txt or https://cmake.org/licensing for details.

cmake_minimum_required(VERSION 3.5)

file(MAKE_DIRECTORY
  "/home/khan/DAA/backend_cpp/build/_deps/cpp-httplib-src"
  "/home/khan/DAA/backend_cpp/build/_deps/cpp-httplib-build"
  "/home/khan/DAA/backend_cpp/build/_deps/cpp-httplib-subbuild/cpp-httplib-populate-prefix"
  "/home/khan/DAA/backend_cpp/build/_deps/cpp-httplib-subbuild/cpp-httplib-populate-prefix/tmp"
  "/home/khan/DAA/backend_cpp/build/_deps/cpp-httplib-subbuild/cpp-httplib-populate-prefix/src/cpp-httplib-populate-stamp"
  "/home/khan/DAA/backend_cpp/build/_deps/cpp-httplib-subbuild/cpp-httplib-populate-prefix/src"
  "/home/khan/DAA/backend_cpp/build/_deps/cpp-httplib-subbuild/cpp-httplib-populate-prefix/src/cpp-httplib-populate-stamp"
)

set(configSubDirs )
foreach(subDir IN LISTS configSubDirs)
    file(MAKE_DIRECTORY "/home/khan/DAA/backend_cpp/build/_deps/cpp-httplib-subbuild/cpp-httplib-populate-prefix/src/cpp-httplib-populate-stamp/${subDir}")
endforeach()
if(cfgdir)
  file(MAKE_DIRECTORY "/home/khan/DAA/backend_cpp/build/_deps/cpp-httplib-subbuild/cpp-httplib-populate-prefix/src/cpp-httplib-populate-stamp${cfgdir}") # cfgdir has leading slash
endif()

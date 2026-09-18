package com.sanctum.common;

public record ApiError(int status, String code, String message) {}

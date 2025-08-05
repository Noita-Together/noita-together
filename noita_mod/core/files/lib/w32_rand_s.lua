local ffi = require("ffi")
ffi.cdef[[
int rand_s(unsigned int* randomValue);
]]

--FFI cast to c runtime rand_s which allegedly generates cryptographically secure
-- random numbers. Useful for seed type stuff that should be unique enough between players
-- https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/rand-s
function w32_rand_s()
    local ret = ffi.new("unsigned int[1]")
    local rc = ffi.C.rand_s(ret)
    if rc and rc ~= 0 then
        --caller should use something else, even if its not random (enough) shrug
        return nil
    end
    return ret[0]
end

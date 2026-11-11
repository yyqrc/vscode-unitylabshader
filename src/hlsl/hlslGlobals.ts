import { l10n } from 'vscode';
import { ParameterInformation } from 'vscode';

export class IEntry { 
    description?: string;
    parameters?: ParameterInformation[];
 }

 //TODO: support multiple entry per name
export interface IEntries { [name: string]: IEntry; }

// From https://docs.microsoft.com/en-ca/windows/win32/direct3dhlsl/dx-graphics-hlsl-intrinsic-functions

export var intrinsicfunctions: IEntries = {
    abort: {
        description: l10n.t('Submits an error message to the information queue and terminates the current draw or dispatch call being executed.'),
    },
    abs: {
        description: l10n.t('Returns the absolute value of the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value') }],
    },
    acos: {
        description: l10n.t('Returns the arccosine of the specified value.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified value. Each component should be a floating-point value within the range of -1 to 1.')
            }
        ],
    },
    all: {
        description: l10n.t('Determines if all components of the specified value are non-zero.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value') }],
    },
    AllMemoryBarrier: {
        description: l10n.t('Blocks execution of all threads in a group until all memory accesses have been completed.'),
    },
    AllMemoryBarrierWithGroupSync: {
        description: l10n.t('Blocks execution of all threads in a group until all memory accesses have been completed and all threads in the group have reached this call.'),
    },
    any: {
        description: l10n.t('Determines if any components of the specified value are non-zero.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value') }],
    },
    asdouble: {
        description: l10n.t('Reinterprets a cast value (two 32-bit values) into a double.'),
        parameters: [
            {
                label: 'lowbits',
                documentation: l10n.t('The low 32-bit pattern of the input value.')
            },
            {
                label: 'highbits',
                documentation: l10n.t('The high 32-bit pattern of the input value.')
            }
        ],
    },
    asfloat: {
        description: l10n.t('Interprets the bit pattern of the input value as a floating-point number.'),
        parameters: [{ label: 'value', documentation: l10n.t('The input value.') }],
    },
    asin: {
        description: l10n.t('Returns the arcsine of the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value') }],
    },
    asint: {
        description: l10n.t('Interprets the bit pattern of the input value as an integer.'),
        parameters: [{ label: 'value', documentation: l10n.t('The input value.') }],
    },
    asuint: {
        description: l10n.t('Reinterprets the bit pattern of a 64-bit value as two unsigned 32-bit integers.'),
        parameters: [
            { label: 'value', documentation: l10n.t('The input value.') },
            {
                label: 'lowbits',
                documentation: l10n.t('The low 32-bit pattern of the input value.')
            },
            {
                label: 'highbits',
                documentation: l10n.t('The high 32-bit pattern of the input value.')
            }
        ],
    },
    atan: {
        description: l10n.t('Returns the arctangent of the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value') }],
    },
    atan2: {
        description: l10n.t('Returns the arctangent of two values (x,y).'),
        parameters: [
            { label: 'y', documentation: l10n.t('The y value.') },
            { label: 'x', documentation: l10n.t('The x value.') }
        ],
    },
    ceil: {
        description: l10n.t('Returns the smallest integer value that is greater than or equal to the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value') }],
    },
    CheckAccessFullyMapped: {
        description: l10n.t('Determines whether all values from a Sample, Gather, or Load operation accessed mapped tiles in a tiled resource.'),
        parameters: [
            {
                label: 'status',
                documentation: l10n.t('The status value that is returned from a Sample, Gather, or Load operation.')
            }
        ],
    },
    clamp: {
        description: l10n.t('Clamps the specified value to the specified minimum and maximum range.'),
        parameters: [
            { label: 'value', documentation: l10n.t('A value to clamp.') },
            { label: 'min', documentation: l10n.t('The specified minimum range.') },
            { label: 'max', documentation: l10n.t('The specified maximum range.') }
        ],
    },
    clip: {
        description: l10n.t('Discards the current pixel if the specified value is less than zero.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value') }],
    },
    cos: {
        description: l10n.t('Returns the cosine of the specified value.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified value, in radians.')
            }
        ],
    },
    cosh: {
        description: l10n.t('Returns the hyperbolic cosine of the specified value.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified value, in radians.')
            }
        ],
    },
    countbits: {
        description: l10n.t('Counts the number of bits (per component) in the input integer.'),
        parameters: [{ label: 'value', documentation: l10n.t('The input value.') }],
    },
    cross: {
        description: l10n.t('Returns the cross product of two floating-point, 3D vectors.'),
        parameters: [
            {
                label: 'x',
                documentation: l10n.t('The first floating-point, 3D vector.')
            },
            {
                label: 'y',
                documentation: l10n.t('The second floating-point, 3D vector.')
            }
        ],
    },
    D3DCOLORtoUBYTE4: {
        description: l10n.t('Converts a floating-point, 4D vector set by a D3DCOLOR to a UBYTE4.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The floating-point vector4 to convert.')
            }
        ],
    },
    ddx: {
        description: l10n.t('Returns the partial derivative of the specified value with respect to the screen-space x-coordinate.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    ddx_coarse: {
        description: l10n.t('Computes a low precision partial derivative with respect to the screen-space x-coordinate.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    ddx_fine: {
        description: l10n.t('Computes a high precision partial derivative with respect to the screen-space x-coordinate.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    ddy: {
        description: l10n.t('Returns the partial derivative of the specified value with respect to the screen-space y-coordinate.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    ddy_coarse: {
        description: l10n.t('Computes a low precision partial derivative with respect to the screen-space y-coordinate.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    ddy_fine: {
        description: l10n.t('Computes a high precision partial derivative with respect to the screen-space y-coordinate.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    degrees: {
        description: l10n.t('Converts the specified value from radians to degrees.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    determinant: {
        description: l10n.t('Returns the determinant of the specified floating-point, square matrix.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    DeviceMemoryBarrier: {
        description: l10n.t('Blocks execution of all threads in a group until all device memory accesses have been completed.'),
    },
    DeviceMemoryBarrierWithGroupSync: {
        description: l10n.t('Blocks execution of all threads in a group until all device memory accesses have been completed and all threads in the group have reached this call.'),
    },
    distance: {
        description: l10n.t('Returns a distance scalar between two vectors.'),
        parameters: [
            {
                label: 'x',
                documentation: l10n.t('The first floating-point vector to compare.')
            },
            {
                label: 'y',
                documentation: l10n.t('The second floating-point vector to compare.')
            }
        ],
    },
    dot: {
        description: l10n.t('Returns the dot product of two vectors.'),
        parameters: [
            { label: 'x', documentation: l10n.t('The first vector.') },
            { label: 'y', documentation: l10n.t('The second vector.') }
        ],
    },
    dst: {
        description: l10n.t('Calculates a distance vector.'),
        parameters: [
            { label: 'x', documentation: l10n.t('The first vector.') },
            { label: 'y', documentation: l10n.t('The second vector.') }
        ],
    },
    errorf: {
        description: l10n.t('Submits an error message to the information queue.'),
        parameters: [
            { label: 'format', documentation: l10n.t('The format string.') },
            { label: 'argument ...', documentation: l10n.t('Optional arguments.') }
        ],
    },
    EvaluateAttributeAtCentroid: {
        description: l10n.t('Evaluates at the pixel centroid.'),
        parameters: [{ label: 'value', documentation: l10n.t('The input value.') }],
    },
    EvaluateAttributeAtSample: {
        description: l10n.t('Evaluates at the indexed sample location.'),
        parameters: [
            { label: 'value', documentation: l10n.t('The input value.') },
            { label: 'sampleIndex', documentation: l10n.t('The sample location.') }
        ],
    },
    EvaluateAttributeSnapped: {
        description: l10n.t('Evaluates at the pixel centroid with an offset.'),
        parameters: [
            { label: 'value', documentation: l10n.t('The input value.') },
            {
                label: 'offset',
                documentation: l10n.t('A 2D offset from the pixel center using a 16x16 grid.')
            }
        ],
    },
    exp: {
        description: l10n.t('Returns the base-e exponential, or e^x, of the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    exp2: {
        description: l10n.t('Returns the base 2 exponential, or 2^x, of the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    f16tof32: {
        description: l10n.t('Converts the float16 stored in the low-half of the uint to a float.'),
        parameters: [{ label: 'value', documentation: l10n.t('The input value.') }],
    },
    f32tof16: {
        description: l10n.t('Converts an input into a float16 type.'),
        parameters: [{ label: 'value', documentation: l10n.t('The input value.') }],
    },
    faceforward: {
        description: l10n.t('Flips the surface-normal (if needed) to face in a direction opposite to i; returns the result in n.'),
        parameters: [
            {
                label: 'n',
                documentation: l10n.t('The resulting floating-point surface-normal vector.')
            },
            {
                label: 'i',
                documentation: l10n.t('A floating-point, incident vector that points from the view position to the shading position.')
            },
            {
                label: 'ng',
                documentation: l10n.t('A floating-point surface-normal vector.')
            }
        ],
    },
    firstbithigh: {
        description: l10n.t('Gets the location of the first set bit starting from the highest order bit and working downward, per component.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    firstbitlow: {
        description: l10n.t('Returns the location of the first set bit starting from the lowest order bit and working upward, per component.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    floor: {
        description: l10n.t('Returns the largest integer that is less than or equal to the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    fma: {
        description: l10n.t('Returns the double-precision fused multiply-addition of a * b + c.'),
        parameters: [
            { label: 'a', documentation: l10n.t('The first value in the fused multiply-addition.') },
            { label: 'b', documentation: l10n.t('The second value in the fused multiply-addition.') },
            { label: 'c', documentation: l10n.t('The third value in the fused multiply-addition.') }
        ],
    },
    fmod: {
        description: l10n.t('Returns the floating-point remainder of x/y.'),
        parameters: [
            { label: 'x', documentation: l10n.t('The floating-point dividend.') },
            { label: 'y', documentation: l10n.t('The floating-point divisor.') }
        ],
    },
    frac: {
        description: l10n.t('Returns the fractional (or decimal) part of x; which is greater than or equal to 0 and less than 1.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    frexp: {
        description: l10n.t('Returns the mantissa and exponent of the specified floating-point value.'),
        parameters: [
            { label: 'x', documentation: l10n.t('The specified floating-point value.') },
            { label: 'exp', documentation: l10n.t('The returned exponent of the x parameter.') }
        ],
    },
    fwidth: {
        description: l10n.t('Returns the absolute value of the partial derivatives of the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    GetRenderTargetSampleCount: {
        description: l10n.t('Gets the number of samples for a render target.'),
    },
    GetRenderTargetSamplePosition: {
        description: l10n.t('Gets the sampling position (x,y) for a given sample index.'),
        parameters: [
            { label: 'index', documentation: l10n.t('A zero-based sample index.') }
        ],
    },
    GroupMemoryBarrier: {
        description: l10n.t('Blocks execution of all threads in a group until all group shared accesses have been completed.'),
    },
    GroupMemoryBarrierWithGroupSync: {
        description: l10n.t('Blocks execution of all threads in a group until all group shared accesses have been completed and all threads in the group have reached this call.'),
    },
    InterlockedAdd: {
        description: l10n.t('Performs a guaranteed atomic add of value to the dest resource variable.'),
        parameters: [
            { label: 'dest', documentation: l10n.t('The destination address.') },
            { label: 'value', documentation: l10n.t('The input value.') },
            {
                label: 'originalValue',
                documentation: l10n.t('Optional. The original input value.')
            }
        ],
    },
    InterlockedAnd: {
        description: l10n.t('Performs a guaranteed atomic and.'),
        parameters: [
            { label: 'dest', documentation: l10n.t('The destination address.') },
            { label: 'value', documentation: l10n.t('The input value.') },
            {
                label: 'originalValue',
                documentation: l10n.t('Optional. The original input value.')
            }
        ],
    },
    InterlockedCompareExchange: {
        description: l10n.t('Atomically compares the destination with the comparison value. If they are identical, the destination is overwritten with the input value.'),
        parameters: [
            { label: 'dest', documentation: l10n.t('The destination address.') },
            {
                label: 'compareValue',
                documentation: l10n.t('The comparison value.')
            },
            { label: 'value', documentation: l10n.t('The input value.') },
            {
                label: 'originalValue',
                documentation: l10n.t('The original value.')
            }
        ],
    },
    InterlockedCompareStore: {
        description: l10n.t('Atomically compares the destination to the comparison value. If they are identical, the destination is overwritten with the input value.'),
        parameters: [
            { label: 'dest', documentation: l10n.t('The destination address.') },
            {
                label: 'compareValue',
                documentation: l10n.t('The comparison value.')
            },
            { label: 'value', documentation: l10n.t('The input value.') }
        ],
    },
    InterlockedExchange: {
        description: l10n.t('Assigns value to dest and returns the original value.'),
        parameters: [
            { label: 'dest', documentation: l10n.t('The destination address.') },
            { label: 'value', documentation: l10n.t('The input value.') },
            {
                label: 'originalValue',
                documentation: l10n.t('The original input value.')
            }
        ],
    },
    InterlockedMax: {
        description: l10n.t('Performs a guaranteed atomic max.'),
        parameters: [
            { label: 'dest', documentation: l10n.t('The destination address.') },
            { label: 'value', documentation: l10n.t('The input value.') },
            {
                label: 'originalValue',
                documentation: l10n.t('Optional. The original input value.')
            }
        ],
    },
    InterlockedMin: {
        description: l10n.t('Performs a guaranteed atomic min.'),
        parameters: [
            { label: 'dest', documentation: l10n.t('The destination address.') },
            { label: 'value', documentation: l10n.t('The input value.') },
            {
                label: 'originalValue',
                documentation: l10n.t('Optional. The original input value.')
            }
        ],
    },
    InterlockedOr: {
        description: l10n.t('Performs a guaranteed atomic or.'),
        parameters: [
            { label: 'dest', documentation: l10n.t('The destination address.') },
            { label: 'value', documentation: l10n.t('The input value.') },
            {
                label: 'originalValue',
                documentation: l10n.t('Optional. The original input value.')
            }
        ],
    },
    InterlockedXor: {
        description: l10n.t('Performs a guaranteed atomic xor.'),
        parameters: [
            { label: 'dest', documentation: l10n.t('The destination address.') },
            { label: 'value', documentation: l10n.t('The input value.') },
            {
                label: 'originalValue',
                documentation: l10n.t('Optional. The original input value.')
            }
        ],
    },
    isfinite: {
        description: l10n.t('Determines if the specified floating-point value is finite.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    isinf: {
        description: l10n.t('Determines if the specified value is infinite.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    isnan: {
        description: l10n.t('Determines if the specified value is NAN or QNAN.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    ldexp: {
        description: l10n.t('Returns the result of multiplying the specified value by two, raised to the power of the specified exponent.'),
        parameters: [
            { label: 'value', documentation: l10n.t('The specified value.') },
            { label: 'exp', documentation: l10n.t('The specified exponent.') }
        ],
    },
    length: {
        description: l10n.t('Returns the length of the specified floating-point vector.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified floating-point vector.')
            }
        ],
    },
    lerp: {
        description: l10n.t('Performs a linear interpolation.'),
        parameters: [
            {
                label: 'x',
                documentation: l10n.t('The first floating-point value.')
            },
            {
                label: 'y',
                documentation: l10n.t('The second floating-point value.')
            },
            {
                label: 's',
                documentation: l10n.t('A value that linearly interpolates between the x parameter and the y parameter.')
            }
        ],
    },
    lit: {
        description: l10n.t('Returns a lighting coefficient vector.'),
        parameters: [
            {
                label: 'nDotL',
                documentation: l10n.t('The dot product of the normalized surface normal and the light vector.')
            },
            {
                label: 'nDotH',
                documentation: l10n.t('The dot product of the half-angle vector and the surface normal.')
            },
            { label: 'm', documentation: l10n.t('A specular exponent.') }
        ],
    },
    log: {
        description: l10n.t('Returns the base-e logarithm of the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    log10: {
        description: l10n.t('Returns the base-10 logarithm of the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    log2: {
        description: l10n.t('Returns the base-2 logarithm of the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    mad: {
        description: l10n.t('Performs an arithmetic multiply/add operation on three values. Returns the result of x * y + a.'),
        parameters: [
            { label: 'x', documentation: l10n.t('The first multiplication value.') },
            { label: 'y', documentation: l10n.t('The second multiplication value.') },
            { label: 'a', documentation: l10n.t('The addition value.') }
        ],
    },
    max: {
        description: l10n.t('Selects the greater of x and y.'),
        parameters: [
            { label: 'x', documentation: l10n.t('The x input value.') },
            { label: 'y', documentation: l10n.t('The y input value.') }
        ],
    },
    min: {
        description: l10n.t('Selects the lesser of x and y.'),
        parameters: [
            { label: 'x', documentation: l10n.t('The x input value.') },
            { label: 'y', documentation: l10n.t('The y input value.') }
        ],
    },
    modf: {
        description: l10n.t('Splits the value x into fractional and integer parts, each of which has the same sign as x.'),
        parameters: [
            { label: 'x', documentation: l10n.t('The x input value.') },
            { label: 'ip', documentation: l10n.t('The integer portion of x.') }
        ],
    },
    msad4: {
        description: l10n.t('Compares a 4-byte reference value and an 8-byte source value and accumulates a vector of 4 sums.'),
        parameters: [
            {
                label: 'reference',
                documentation: l10n.t('The reference array of 4 bytes in one uint value.')
            },
            {
                label: 'source',
                documentation: l10n.t('The source array of 8 bytes in two uint2 values.')
            },
            {
                label: 'accum',
                documentation: l10n.t('A vector of 4 values to accumulate.')
            }
        ],
    },
    mul: {
        description: l10n.t('Multiplies x and y using matrix math. The inner dimension x-columns and y-rows must be equal.'),
        parameters: [
            {
                label: 'x',
                documentation: l10n.t('The x input value. If x is a vector, it treated as a row vector.')
            },
            {
                label: 'y',
                documentation: l10n.t('The y input value. If y is a vector, it treated as a column vector.')
            }
        ],
    },
    noise: {
        description: l10n.t('Generates a random value using the Perlin-noise algorithm.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('A floating-point vector from which to generate Perlin noise.')
            }
        ],
    },
    normalize: {
        description: l10n.t('Normalizes the specified floating-point vector according to x / length(x).'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified floating-point vector.')
            }
        ],
    },
    pow: {
        description: l10n.t('Returns the specified value raised to the specified power.'),
        parameters: [
            { label: 'x', documentation: l10n.t('The specified value.') },
            { label: 'y', documentation: l10n.t('The specified power.') }
        ],
    },
    printf: {
        description: l10n.t('Submits a custom shader message to the information queue.'),
        parameters: [
            { label: 'format', documentation: l10n.t('The format string.') },
            { label: 'argument ...', documentation: l10n.t('Optional arguments.') }
        ],
    },
    Process2DQuadTessFactorsAvg: {
        description: l10n.t('Generates the corrected tessellation factors for a quad patch (using average).'),
        parameters: [
            { label: 'RawEdgeFactors', documentation: l10n.t('The edge tessellation factors.') },
            { label: 'InsideScale', documentation: l10n.t('The scale factor (0.0 to 1.0).') },
            { label: 'RoundedEdgeTessFactors', documentation: l10n.t('The rounded edge factors.') },
            { label: 'RoundedInsideTessFactors', documentation: l10n.t('The rounded inside factors.') },
            { label: 'UnroundedInsideTessFactors', documentation: l10n.t('The unrounded inside factors.') }
        ],
    },
    Process2DQuadTessFactorsMax: {
        description: l10n.t('Generates the corrected tessellation factors for a quad patch (using maximum).'),
        parameters: [
            { label: 'RawEdgeFactors', documentation: l10n.t('The edge tessellation factors.') },
            { label: 'InsideScale', documentation: l10n.t('The scale factor (0.0 to 1.0).') },
            { label: 'RoundedEdgeTessFactors', documentation: l10n.t('The rounded edge factors.') },
            { label: 'RoundedInsideTessFactors', documentation: l10n.t('The rounded inside factors.') },
            { label: 'UnroundedInsideTessFactors', documentation: l10n.t('The unrounded inside factors.') }
        ],
    },
    Process2DQuadTessFactorsMin: {
        description: l10n.t('Generates the corrected tessellation factors for a quad patch (using minimum).'),
        parameters: [
            { label: 'RawEdgeFactors', documentation: l10n.t('The edge tessellation factors.') },
            { label: 'InsideScale', documentation: l10n.t('The scale factor (0.0 to 1.0).') },
            { label: 'RoundedEdgeTessFactors', documentation: l10n.t('The rounded edge factors.') },
            { label: 'RoundedInsideTessFactors', documentation: l10n.t('The rounded inside factors.') },
            { label: 'UnroundedInsideTessFactors', documentation: l10n.t('The unrounded inside factors.') }
        ],
    },
    ProcessIsolineTessFactors: {
        description: l10n.t('Generates the rounded tessellation factors for an isoline.'),
        parameters: [
            { label: 'RawDetailFactor', documentation: l10n.t('The desired detail factor.') },
            { label: 'RawDensityFactor', documentation: l10n.t('The desired density factor.') },
            { label: 'RoundedDetailFactor', documentation: l10n.t('The rounded detail factor.') },
            { label: 'RoundedDensityFactor', documentation: l10n.t('The rounded density factor.') }
        ],
    },
    ProcessQuadTessFactorsAvg: {
        description: l10n.t('Generates the corrected tessellation factors for a quad patch (using average).'),
        parameters: [
            { label: 'RawEdgeFactors', documentation: l10n.t('The edge tessellation factors.') },
            { label: 'InsideScale', documentation: l10n.t('The scale factor (0.0 to 1.0).') },
            { label: 'RoundedEdgeTessFactors', documentation: l10n.t('The rounded edge factors.') },
            { label: 'RoundedInsideTessFactors', documentation: l10n.t('The rounded inside factors.') },
            { label: 'UnroundedInsideTessFactors', documentation: l10n.t('The unrounded inside factors.') }
        ],
    },
    ProcessQuadTessFactorsMax: {
        description: l10n.t('Generates the corrected tessellation factors for a quad patch (using maximum).'),
        parameters: [
            { label: 'RawEdgeFactors', documentation: l10n.t('The edge tessellation factors.') },
            { label: 'InsideScale', documentation: l10n.t('The scale factor (0.0 to 1.0).') },
            { label: 'RoundedEdgeTessFactors', documentation: l10n.t('The rounded edge factors.') },
            { label: 'RoundedInsideTessFactors', documentation: l10n.t('The rounded inside factors.') },
            { label: 'UnroundedInsideTessFactors', documentation: l10n.t('The unrounded inside factors.') }
        ],
    },
    ProcessQuadTessFactorsMin: {
        description: l10n.t('Generates the corrected tessellation factors for a quad patch (using minimum).'),
        parameters: [
            { label: 'RawEdgeFactors', documentation: l10n.t('The edge tessellation factors.') },
            { label: 'InsideScale', documentation: l10n.t('The scale factor (0.0 to 1.0).') },
            { label: 'RoundedEdgeTessFactors', documentation: l10n.t('The rounded edge factors.') },
            { label: 'RoundedInsideTessFactors', documentation: l10n.t('The rounded inside factors.') },
            { label: 'UnroundedInsideTessFactors', documentation: l10n.t('The unrounded inside factors.') }
        ],
    },
    ProcessTriTessFactorsAvg: {
        description: l10n.t('Generates the corrected tessellation factors for a triangle patch (using average).'),
        parameters: [
            { label: 'RawEdgeFactors', documentation: l10n.t('The edge tessellation factors.') },
            { label: 'InsideScale', documentation: l10n.t('The scale factor (0.0 to 1.0).') },
            { label: 'RoundedEdgeTessFactors', documentation: l10n.t('The rounded edge factors.') },
            { label: 'RoundedInsideTessFactors', documentation: l10n.t('The rounded inside factors.') },
            { label: 'UnroundedInsideTessFactors', documentation: l10n.t('The unrounded inside factors.') }
        ],
    },
    ProcessTriTessFactorsMax: {
        description: l10n.t('Generates the corrected tessellation factors for a triangle patch (using maximum).'),
        parameters: [
            { label: 'RawEdgeFactors', documentation: l10n.t('The edge tessellation factors.') },
            { label: 'InsideScale', documentation: l10n.t('The scale factor (0.0 to 1.0).') },
            { label: 'RoundedEdgeTessFactors', documentation: l10n.t('The rounded edge factors.') },
            { label: 'RoundedInsideTessFactors', documentation: l10n.t('The rounded inside factors.') },
            { label: 'UnroundedInsideTessFactors', documentation: l10n.t('The unrounded inside factors.') }
        ],
    },
    ProcessTriTessFactorsMin: {
        description: l10n.t('Generates the corrected tessellation factors for a triangle patch (using minimum).'),
        parameters: [
            { label: 'RawEdgeFactors', documentation: l10n.t('The edge tessellation factors.') },
            { label: 'InsideScale', documentation: l10n.t('The scale factor (0.0 to 1.0).') },
            { label: 'RoundedEdgeTessFactors', documentation: l10n.t('The rounded edge factors.') },
            { label: 'RoundedInsideTessFactors', documentation: l10n.t('The rounded inside factors.') },
            { label: 'UnroundedInsideTessFactors', documentation: l10n.t('The unrounded inside factors.') }
        ],
    },
    radians: {
        description: l10n.t('Converts the specified value from degrees to radians.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    rcp: {
        description: l10n.t('Calculates a fast, approximate, per-component reciprocal.'),
        parameters: [{ label: 'value', documentation: l10n.t('The input value.') }],
    },
    reflect: {
        description: l10n.t('Returns a reflection vector using an incident ray and a surface normal.'),
        parameters: [
            {
                label: 'i',
                documentation: l10n.t('A floating-point, incident vector.')
            },
            {
                label: 'n',
                documentation: l10n.t('A floating-point, normal vector.')
            }
        ],
    },
    refract: {
        description: l10n.t('Returns a refraction vector using an entering ray, a surface normal, and a refraction index.'),
        parameters: [
            {
                label: 'i',
                documentation: l10n.t('A floating-point, ray direction vector.')
            },
            {
                label: 'n',
                documentation: l10n.t('A floating-point, surface normal vector.')
            },
            {
                label: 'η',
                documentation: l10n.t('A floating-point, refraction index scalar.')
            }
        ],
    },
    reversebits: {
        description: l10n.t('Reverses the order of the bits, per component.'),
        parameters: [{ label: 'value', documentation: l10n.t('The input value.') }],
    },
    round: {
        description: l10n.t('Rounds the specified value to the nearest integer.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    rsqrt: {
        description: l10n.t('Returns the reciprocal of the square root of the specified value.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    saturate: {
        description: l10n.t('Clamps the specified value within the range of 0 to 1.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified value.') }],
    },
    sign: {
        description: l10n.t('Returns the sign of x.'),
        parameters: [{ label: 'value', documentation: l10n.t('The input value.') }],
    },
    sin: {
        description: l10n.t('Returns the sine of the specified value.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified value, in radians.')
            }
        ],
    },
    sincos: {
        description: l10n.t('Returns the sine and cosine of x.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified value, in radians.')
            },
            { label: 's', documentation: l10n.t('Returns the sine of x.') },
            { label: 'c', documentation: l10n.t('Returns the cosine of x.') }
        ],
    },
    sinh: {
        description: l10n.t('Returns the hyperbolic sine of the specified value.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified value, in radians.')
            }
        ],
    },
    smoothstep: {
        description: l10n.t('Returns a smooth Hermite interpolation between 0 and 1, if x is in the range [min, max].'),
        parameters: [
            {
                label: 'min',
                documentation: l10n.t('The minimum range of the x parameter.')
            },
            {
                label: 'max',
                documentation: l10n.t('The maximum range of the x parameter.')
            },
            {
                label: 'x',
                documentation: l10n.t('The specified value to be interpolated.')
            }
        ],
    },
    sqrt: {
        description: l10n.t('Returns the square root of the specified floating-point value, per component.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified floating-point value.')
            }
        ],
    },
    step: {
        description: l10n.t('Compares two values, returning 0 or 1 based on which value is greater.'),
        parameters: [
            {
                label: 'y',
                documentation: l10n.t('The first floating-point value to compare.')
            },
            {
                label: 'x',
                documentation: l10n.t('The second floating-point value to compare.')
            }
        ],
    },
    tan: {
        description: l10n.t('Returns the tangent of the specified value.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified value, in radians.')
            }
        ],
    },
    tanh: {
        description: l10n.t('Returns the hyperbolic tangent of the specified value.'),
        parameters: [
            {
                label: 'value',
                documentation: l10n.t('The specified value, in radians.')
            }
        ],
    },
    tex1D: {
        description: l10n.t('Samples a 1D texture.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex1Dbias: {
        description: l10n.t('Samples a 1D texture after biasing the mip level by t.w.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex1Dgrad: {
        description: l10n.t('Samples a 1D texture using a gradient to select the mip level.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') },
            {
                label: 'ddx',
                documentation: l10n.t('Rate of change of the surface geometry in the x direction.')
            },
            {
                label: 'ddy',
                documentation: l10n.t('Rate of change of the surface geometry in the y direction.')
            }
        ],
    },
    tex1Dlod: {
        description: l10n.t('Samples a 1D texture with mipmaps. The mipmap LOD is specified in t.w.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex1Dproj: {
        description: l10n.t('Samples a 1D texture using a projective divide; the texture coordinate is divided by t.w before the lookup takes place.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex2D: {
        description: l10n.t('Samples a 2D texture.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex2Dbias: {
        description: l10n.t('Samples a 2D texture after biasing the mip level by t.w.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex2Dgrad: {
        description: l10n.t('Samples a 2D texture using a gradient to select the mip level.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') },
            {
                label: 'ddx',
                documentation: l10n.t('Rate of change of the surface geometry in the x direction.')
            },
            {
                label: 'ddy',
                documentation: l10n.t('Rate of change of the surface geometry in the y direction.')
            }
        ],
    },
    tex2Dlod: {
        description: l10n.t('Samples a 2D texture with mipmaps. The mipmap LOD is specified in t.w.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex2Dproj: {
        description: l10n.t('Samples a 2D texture using a projective divide; the texture coordinate is divided by t.w before the lookup takes place.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex3D: {
        description: l10n.t('Samples a 3D texture.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex3Dbias: {
        description: l10n.t('Samples a 3D texture after biasing the mip level by t.w.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex3Dgrad: {
        description: l10n.t('Samples a 3D texture using a gradient to select the mip level.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') },
            {
                label: 'ddx',
                documentation: l10n.t('Rate of change of the surface geometry in the x direction.')
            },
            {
                label: 'ddy',
                documentation: l10n.t('Rate of change of the surface geometry in the y direction.')
            }
        ],
    },
    tex3Dlod: {
        description: l10n.t('Samples a 3D texture with mipmaps. The mipmap LOD is specified in t.w.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    tex3Dproj: {
        description: l10n.t('Samples a 3D texture using a projective divide; the texture coordinate is divided by t.w before the lookup takes place.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    texCUBE: {
        description: l10n.t('Samples a cube texture.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    texCUBEbias: {
        description: l10n.t('Samples a cube texture after biasing the mip level by t.w.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    texCUBEgrad: {
        description: l10n.t('Samples a cube texture using a gradient to select the mip level.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') },
            {
                label: 'ddx',
                documentation: l10n.t('Rate of change of the surface geometry in the x direction.')
            },
            {
                label: 'ddy',
                documentation: l10n.t('Rate of change of the surface geometry in the y direction.')
            }
        ],
    },
    texCUBElod: {
        description: l10n.t('Samples a cube texture with mipmaps. The mipmap LOD is specified in t.w.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    texCUBEproj: {
        description: l10n.t('Samples a cube texture using a projective divide; the texture coordinate is divided by t.w before the lookup takes place.'),
        parameters: [
            { label: 's', documentation: l10n.t('The sampler state.') },
            { label: 't', documentation: l10n.t('The texture coordinate.') }
        ],
    },
    transpose: {
        description: l10n.t('Transposes the specified input matrix.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified matrix.') }],
    },
    trunc: {
        description: l10n.t('Truncates a floating-point value to the integer component.'),
        parameters: [{ label: 'value', documentation: l10n.t('The specified input.') }],
    },

    // ============ Wave Intrinsics (Shader Model 6.0+) ============
    WaveActiveAllEqual: {
        description: l10n.t('Returns true if the expression is the same for every active lane in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to compare.') }],
    },
    WaveActiveBitAnd: {
        description: l10n.t('Returns the bitwise AND of all the values of the expression across all active lanes in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to AND.') }],
    },
    WaveActiveBitOr: {
        description: l10n.t('Returns the bitwise OR of all the values of the expression across all active lanes in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to OR.') }],
    },
    WaveActiveBitXor: {
        description: l10n.t('Returns the bitwise XOR of all the values of the expression across all active lanes in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to XOR.') }],
    },
    WaveActiveCountBits: {
        description: l10n.t('Counts the number of boolean variables which evaluate to true across all active lanes in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The boolean value to count.') }],
    },
    WaveActiveMax: {
        description: l10n.t('Returns the maximum value of the expression across all active lanes in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to find the max of.') }],
    },
    WaveActiveMin: {
        description: l10n.t('Returns the minimum value of the expression across all active lanes in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to find the min of.') }],
    },
    WaveActiveProduct: {
        description: l10n.t('Returns the product of all the values of the expression across all active lanes in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to multiply.') }],
    },
    WaveActiveSum: {
        description: l10n.t('Returns the sum of all the values of the expression across all active lanes in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to sum.') }],
    },
    WaveActiveAllTrue: {
        description: l10n.t('Returns true if the expression is true in all active lanes in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The boolean value to test.') }],
    },
    WaveActiveAnyTrue: {
        description: l10n.t('Returns true if the expression is true in any active lane in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The boolean value to test.') }],
    },
    WaveActiveBallot: {
        description: l10n.t('Returns a uint4 containing a bitmask of the evaluation of the boolean expression for all active lanes in the current wave.'),
        parameters: [{ label: 'value', documentation: l10n.t('The boolean value to test.') }],
    },
    WaveGetLaneCount: {
        description: l10n.t('Returns the number of lanes in a wave on this architecture.'),
    },
    WaveGetLaneIndex: {
        description: l10n.t('Returns the index of the current lane within the current wave.'),
    },
    WaveIsFirstLane: {
        description: l10n.t('Returns true only for the active lane in the current wave with the smallest index.'),
    },
    WavePrefixCountBits: {
        description: l10n.t('Returns the sum of all the specified boolean values in active lanes in the current wave with indices less than this lane.'),
        parameters: [{ label: 'value', documentation: l10n.t('The boolean value to count.') }],
    },
    WavePrefixProduct: {
        description: l10n.t('Returns the product of all of the values in the active lanes in this wave with indices less than this lane.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to multiply.') }],
    },
    WavePrefixSum: {
        description: l10n.t('Returns the sum of all of the values in the active lanes with smaller indices than this one.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to sum.') }],
    },
    WaveReadLaneAt: {
        description: l10n.t('Returns the value of the expression for the given lane index within the specified wave.'),
        parameters: [
            { label: 'value', documentation: l10n.t('The value to read.') },
            { label: 'laneIndex', documentation: l10n.t('The lane index to read from.') }
        ],
    },
    WaveReadLaneFirst: {
        description: l10n.t('Returns the value of the expression for the active lane of the current wave with the smallest index.'),
        parameters: [{ label: 'value', documentation: l10n.t('The value to read.') }],
    },

    // ============ Quad Intrinsics (Shader Model 6.0+) ============
    QuadReadLaneAt: {
        description: l10n.t('Returns the specified source value from the lane identified by the lane ID within the current quad.'),
        parameters: [
            { label: 'value', documentation: l10n.t('The source value.') },
            { label: 'quadLaneID', documentation: l10n.t('The lane ID within the quad (0-3).') }
        ],
    },
    QuadReadAcrossDiagonal: {
        description: l10n.t('Returns the specified local value which is read from the diagonally opposite lane in this quad.'),
        parameters: [{ label: 'value', documentation: l10n.t('The source value.') }],
    },
    QuadReadAcrossX: {
        description: l10n.t('Returns the specified local value read from the other lane in this quad in the X direction.'),
        parameters: [{ label: 'value', documentation: l10n.t('The source value.') }],
    },
    QuadReadAcrossY: {
        description: l10n.t('Returns the specified local value read from the other lane in this quad in the Y direction.'),
        parameters: [{ label: 'value', documentation: l10n.t('The source value.') }],
    },

    // ============ Other Advanced Functions ============
    NonUniformResourceIndex: {
        description: l10n.t('Marks a resource index as non-uniform, allowing divergent indexing into resource arrays.'),
        parameters: [{ label: 'index', documentation: l10n.t('The resource index.') }],
    },
    
    // ============ Texture Object Methods ============
    Sample: {
        description: l10n.t('Samples a texture.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') }
        ],
    },
    SampleBias: {
        description: l10n.t('Samples a texture with a bias applied to the mipmap level.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') },
            { label: 'bias', documentation: l10n.t('The bias value.') }
        ],
    },
    SampleCmp: {
        description: l10n.t('Samples a texture and compares a single component against the specified comparison value.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler comparison state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') },
            { label: 'compareValue', documentation: l10n.t('A value to compare.') }
        ],
    },
    SampleCmpLevelZero: {
        description: l10n.t('Samples a texture at mipmap level 0 and compares the result to a comparison value.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler comparison state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') },
            { label: 'compareValue', documentation: l10n.t('A value to compare.') }
        ],
    },
    SampleGrad: {
        description: l10n.t('Samples a texture using a gradient to influence the way the sample location is calculated.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') },
            { label: 'ddx', documentation: l10n.t('The rate of change in the x direction.') },
            { label: 'ddy', documentation: l10n.t('The rate of change in the y direction.') }
        ],
    },
    SampleLevel: {
        description: l10n.t('Samples a texture on the specified mipmap level.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') },
            { label: 'lod', documentation: l10n.t('The mipmap level.') }
        ],
    },
    Load: {
        description: l10n.t('Reads texel data without any filtering or sampling.'),
        parameters: [{ label: 'location', documentation: l10n.t('The texture coordinates with mip level.') }],
    },
    Gather: {
        description: l10n.t('Gets the four samples (red component only) that would be used for bilinear interpolation when sampling a texture.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') }
        ],
    },
    GatherRed: {
        description: l10n.t('Gets the red components of the four samples that would be used for bilinear interpolation.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') }
        ],
    },
    GatherGreen: {
        description: l10n.t('Gets the green components of the four samples that would be used for bilinear interpolation.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') }
        ],
    },
    GatherBlue: {
        description: l10n.t('Gets the blue components of the four samples that would be used for bilinear interpolation.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') }
        ],
    },
    GatherAlpha: {
        description: l10n.t('Gets the alpha components of the four samples that would be used for bilinear interpolation.'),
        parameters: [
            { label: 'sampler', documentation: l10n.t('The sampler state.') },
            { label: 'location', documentation: l10n.t('The texture coordinates.') }
        ],
    },
    GetDimensions: {
        description: l10n.t('Gets the texture dimensions.'),
        parameters: [
            { label: 'width', documentation: l10n.t('The texture width.') },
            { label: 'height', documentation: l10n.t('The texture height (if applicable).') },
            { label: 'numberOfLevels', documentation: l10n.t('The number of mipmap levels.') }
        ],
    }
};

export var preprocessors: IEntries = {
    DEFINE: {
        description: l10n.t('Preprocessor directive that defines a constant or a macro.'),
    },
    ERROR: {
        description: l10n.t('Preprocessor directive that produces compiler-time error messages.'),
    },
    IF: {
        description: l10n.t('Preprocessor directives that control compilation of portions of a source file.'),
    },
    ELIF: {
        description: l10n.t('Preprocessor directives that control compilation of portions of a source file.'),
    },
    ELSE: {
        description: l10n.t('Preprocessor directives that control compilation of portions of a source file.'),
    },
    ENDIF: {
        description: l10n.t('Preprocessor directives that control compilation of portions of a source file.'),
    },
    IFDEF: {
        description: l10n.t('Preprocessor directives that determine whether a specific preprocessor constant or macro is defined.'),
    },
    IFNDEF: {
        description: l10n.t('Preprocessor directives that determine whether a specific preprocessor constant or macro is defined.'),
    },
    INCLUDE: {
        description: l10n.t('Preprocessor directive that inserts the contents of the specified file into the source program at the point where the directive appears.'),
    },
    LINE: {
        description: l10n.t('Preprocessor directive that sets the compiler\'s internally-stored line number and filename to the specified values.'),
    },
    PRAGMA: {
        description: l10n.t('Preprocessor directive that provides machine-specific or operating system-specific features while retaining overall compatibility with the C and C++ languages.'),
    },
    UNDEF: {
        description: l10n.t('Preprocessor directive that removes the current definition of a constant or macro that was previously defined using the #define directive.'),
    }
};

export var semanticsNum: IEntries = {
    BINORMAL: {
        description: l10n.t('Binormal'),
    },
    BLENDINDICES: {
        description: l10n.t('Blend indices'),
    },
    BLENDWEIGHT: {
        description: l10n.t('Blend weights'),
    },
    COLOR: {
        description: l10n.t('Diffuse and/or specular color'),
    },
    NORMAL: {
        description: l10n.t('Normal vector'),
    },
    POSITION: {
        description: l10n.t('Vertex position in object space.'),
    },
    PSIZE: {
        description: l10n.t('Point size'),
    },
    TANGENT: {
        description: l10n.t('Tangent'),
    },
    TEXCOORD: {
        description: l10n.t('Texture coordinates'),
    },
    TESSFACTOR: {
        description: l10n.t('Tessellation factor'),
    },
    DEPTH: {
        description: l10n.t('Output depth'),
    },
    SV_CLIPDISTANCE: {
        description: l10n.t('Clip distance data.'),
    },
    SV_CULLDISTANCE: {
        description: l10n.t('Cull distance data.'),
    },
    SV_DEPTHGREATEREQUAL: {
        description: l10n.t('Valid in any shader, tests whether the value is greater than or equal to the depth data value.'),
    },
    SV_DEPTHLESSEQUAL: {
        description: l10n.t('Valid in any shader, tests whether the value is less than or equal to the depth data value.'),
    },
    SV_TARGET: {
        description: l10n.t('The output value that will be stored in a render target. The index indicates which of the 8 possibly bound render targets to write to. The value is available to all shaders.'),
    }
};

export var semantics: IEntries = {
    POSITIONT: {
        description: l10n.t('Transformed vertex position.'),
    },
    FOG: {
        description: l10n.t('Vertex fog'),
    },
    PSIZE: {
        description: l10n.t('Point size'),
    },
    VFACE: {
        description: l10n.t('Floating-point scalar that indicates a back-facing primitive. A negative value faces backwards, while a positive value faces the camera.'),
    },
    VPOS: {
        description: l10n.t('The pixel location (x,y) in screen space.'),
    },
    SV_COVERAGE: {
        description: l10n.t('A mask that can be specified on input, output, or both of a pixel shader.'),
    },
    SV_DEPTH: {
        description: l10n.t('Depth buffer data. Can be written or read by any shader.'),
    },
    SV_DISPATCHTHREADID: {
        description: l10n.t('Defines the global thread offset within the Dispatch call, per dimension of the group. Available as input to compute shader. (read only)'),
    },
    SV_DOMAINLOCATION: {
        description: l10n.t('Defines the location on the hull of the current domain point being evaluated. Available as input to the domain shader. (read only)'),
    },
    SV_GROUPID: {
        description: l10n.t('Defines the group offset within a Dispatch call, per dimension of the dispatch call. Available as input to the compute shader. (read only)'),
    },
    SV_GROUPINDEX: {
        description: l10n.t('Provides a flattened index for a given thread within a given group. Available as input to the compute shader. (read only)'),
    },
    SV_GROUPTHREADID: {
        description: l10n.t('Defines the thread offset within the group, per dimension of the group. Available as input to the compute shader. (read only)'),
    },
    SV_GSINSTANCEID: {
        description: l10n.t('Defines the instance of the geometry shader. Available as input to the geometry shader. The instance is needed as a geometry shader can be invoked up to 32 times on the same geometry primitive.'),
    },
    SV_INNERCOVERAGE: {
        description: l10n.t('Represents underestimated conservative rasterization information (i.e. whether a pixel is guaranteed-to-be-fully covered). Can be read or written by the pixel shader.'),
    },
    SV_INSIDETESSFACTOR: {
        description: l10n.t('Defines the tessellation amount within a patch surface. Available in the hull shader for writing, and available in the domain shader for reading.'),
    },
    SV_INSTANCEID: {
        description: l10n.t('Per-instance identifier automatically generated by the runtime (see Using System-Generated Values (Direct3D 10)). Available to all shaders.'),
    },
    SV_ISFRONTFACE: {
        description: l10n.t('Specifies whether a triangle is front facing. For lines and points, IsFrontFace has the value true. The exception is lines drawn out of triangles (wireframe mode), which sets IsFrontFace the same way as rasterizing the triangle in solid mode. Can be written to by the geometry shader, and read by the pixel shader.'),
    },
    SV_OUTPUTCONTROLPOINTID: {
        description: l10n.t('Defines the index of the control point ID being operated on by an invocation of the main entry point of the hull shader. Can be read by the hull shader only.'),
    },
    SV_POSITION: {
        description: l10n.t('When SV_Position is declared for input to a shader, it can have one of two interpolation modes specified: linearNoPerspective or linearNoPerspectiveCentroid, where the latter causes centroid-snapped xyzw values to be provided when multisample antialiasing. When used in a shader, SV_Position describes the pixel location. Available in all shaders to get the pixel center with a 0.5 offset.'),
    },
    SV_PRIMITIVEID: {
        description: l10n.t('Per-primitive identifier automatically generated by the runtime (see Using System-Generated Values (Direct3D 10)). Can be written to by the geometry or pixel shaders, and read by the geometry, pixel, hull or domain shaders.'),
    },
    SV_RENDERTARGETARRAYINDEX: {
        description: l10n.t('Render-target array index. Applied to geometry shader output and indicates the render target array slice that the primitive will be drawn to by the pixel shader. SV_RenderTargetArrayIndex is only valid if the render target is an array resource. This semantic applies only to primitives, if a primitive has more than one vertex the value from the leading vertex will be used. This value also indicates which array slice of a depthstencilview is used for read/write purposes. Can be written from the geometry shader and read or written by the pixel shader.'),
    },
    SV_SAMPLEINDEX: {
        description: l10n.t('Sample frequency index data. Available to be read or written to by the pixel shader only.'),
    },
    SV_STENCILREF: {
        description: l10n.t('Represents the current pixel shader stencil reference value. Can be written by the pixel shader only.'),
    },
    SV_TESSFACTOR: {
        description: l10n.t('Defines the tessellation amount on each edge of a patch. Available for writing in the hull shader and reading in the domain shader.'),
    },
    SV_VERTEXID: {
        description: l10n.t('Per-vertex identifier automatically generated by the runtime (see Using System-Generated Values (Direct3D 10)). Available as the input to the vertex shader only.'),
    },
    SV_VIEWPORTARRAYINDEX: {
        description: l10n.t('Viewport array index. Applied to geometry shader output and indicates which viewport to use for the primitive currently being written out. Can be read or written by the pixel shader. The primitive will be transformed and clipped against the viewport specified by the index before it is passed to the rasterizer. This semantic applies only to primitives, if a primitive has more than one vertex the value from the leading vertex will be used.'),
    }
};

export var datatypes: IEntries = {
    bool: {
        description: l10n.t('true or false.'),
    },
    int: {
        description: l10n.t('32-bit signed integer.'),
    },
    int1: {
        description: l10n.t('32-bit signed integer vector.'),
    },
    int2: {
        description: l10n.t('32-bit signed integer vector.'),
    },
    int3: {
        description: l10n.t('32-bit signed integer vector.'),
    },
    int4: {
        description: l10n.t('32-bit signed integer vector.'),
    },
    int1x1: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int1x2: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int1x3: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int1x4: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int2x1: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int2x2: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int2x3: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int2x4: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int3x1: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int3x2: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int3x3: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int3x4: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int4x1: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int4x2: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int4x3: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    int4x4: {
        description: l10n.t('32-bit signed integer matrix.'),
    },
    uint: {
        description: l10n.t('32-bit unsigned integer.'),
    },
    dword: {
        description: l10n.t('32-bit unsigned integer.'),
    },
    half: {
        description: l10n.t('16-bit floating point value. This data type is provided only for language compatibility. Direct3D 10 shader targets map all half data types to float data types. A half data type cannot be used on a uniform global variable (use the /Gec flag if this functionality is desired).'),
    },
    half1: {
        description: l10n.t('16-bit floating point vector.'),
    },
    half2: {
        description: l10n.t('16-bit floating point vector.'),
    },
    half3: {
        description: l10n.t('16-bit floating point vector.'),
    },
    half4: {
        description: l10n.t('16-bit floating point vector.'),
    },
    float: {
        description: l10n.t('32-bit floating point value.'),
    },
    float1: {
        description: l10n.t('32-bit floating point vector.'),
    },
    float2: {
        description: l10n.t('32-bit floating point vector.'),
    },
    float3: {
        description: l10n.t('32-bit floating point vector.'),
    },
    float4: {
        description: l10n.t('32-bit floating point vector.'),
    },
    float1x1: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float1x2: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float1x3: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float1x4: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float2x1: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float2x2: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float2x3: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float2x4: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float3x1: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float3x2: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float3x3: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float3x4: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float4x1: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float4x2: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float4x3: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    float4x4: {
        description: l10n.t('32-bit floating point matrix.'),
    },
    double: {
        description: l10n.t('64-bit floating point value. You cannot use double precision values as inputs and outputs for a stream. To pass double precision values between shaders, declare each double as a pair of uint data types. Then, use the asdouble function to pack each double into the pair of uints and the asuint function to unpack the pair of uints back into the double.'),
    },
    min16float: {
        description: l10n.t('minimum 16-bit floating point value.'),
    },
    min10float: {
        description: l10n.t('minimum 10-bit floating point value.'),
    },
    min16int: {
        description: l10n.t('minimum 16-bit signed integer.'),
    },
    min12int: {
        description: l10n.t('minimum 12-bit signed integer.'),
    },
    min16uint: {
        description: l10n.t('minimum 16-bit unsigned integer.'),
    },
    Buffer: {
        description: l10n.t('Use to declare a buffer variable.'),
    },
    vector: {
        description: l10n.t('A vector contains between one and four scalar components; every component of a vector must be of the same type.'),
    },
    matrix: {
        description: l10n.t('A matrix is a special data type that contains between one and sixteen components. Every component of a matrix must be of the same type.'),
    },
    sampler: {
        description: l10n.t('Use to declare sampler state as well as sampler-comparison state.'),
    },
    SamplerState: {
        description: l10n.t('Use to declare sampler state as well as sampler-comparison state.'),
    },
    PixelShader: {
        description: l10n.t('Declare a shader variable within an effect pass.'),
    },
    VertexShader: {
        description: l10n.t('Declare a shader variable within an effect pass.'),
    },
    texture: {
        description: l10n.t('Use to declare a texture variable.'),
    },
    Texture1D: {
        description: l10n.t('Use to declare a texture variable.'),
    },
    Texture1DArray: {
        description: l10n.t('Use to declare a texture variable.'),
    },
    Texture2D: {
        description: l10n.t('Use to declare a texture variable.'),
    },
    Texture2DArray: {
        description: l10n.t('Use to declare a texture variable.'),
    },
    Texture2DMS: {
        description: l10n.t('Use to declare a texture variable.'),
    },
    Texture2DMSArray: {
        description: l10n.t('Use to declare a texture variable.'),
    },
    Texture3D: {
        description: l10n.t('Use to declare a texture variable.'),
    },
    TextureCube: {
        description: l10n.t('Use to declare a texture variable.'),
    },
    TextureCubeArray: {
        description: l10n.t('Use to declare a texture variable.'),
    },
    struct: {
        description: l10n.t('Use to declare a structure using HLSL.'),
    },
    typedef: {
        description: l10n.t('Use to declare a user-defined type.'),
    }
};

//TODO: descriptions and links
export var keywords: IEntries = {
    AppendStructuredBuffer: { description: "" },
    asm: { description: "" },
    asm_fragment: { description: "" },
    BlendState: { description: "" }, 
    bool: { description: "" }, 
    break: { description: "" }, 
    Buffer: { description: "" }, 
    ByteAddressBuffer: { description: "" },
    case: { description: "" }, 
    cbuffer: { description: "" }, 
    centroid: { description: "" }, 
    class: { description: "" }, 
    column_major: { description: "" }, 
    compile: { description: "" }, 
    compile_fragment: { description: "" }, 
    CompileShader: { description: "" }, 
    const: { description: "" }, 
    continue: { description: "" }, 
    ComputeShader: { description: "" }, 
    ConsumeStructuredBuffer: { description: "" },
    default: { description: "" }, 
    DepthStencilState: { description: "" }, 
    DepthStencilView: { description: "" }, 
    discard: { description: "" }, 
    do: { description: "" }, 
    double: { description: "" }, 
    DomainShader: { description: "" }, 
    dword: { description: "" },
    else: { description: "" }, 
    export: { description: "" }, 
    extern: { description: "" },
    false: { description: "" }, 
    float: { description: "" }, 
    for: { description: "" }, 
    fxgroup: { description: "" },
    GeometryShader: { description: "" }, 
    groupshared: { description: "" },
    half: { description: "" }, 
    Hullshader: { description: "" },
    if: { description: "" }, 
    in: { description: "" }, 
    inline: { description: "" }, 
    inout: { description: "" }, 
    InputPatch: { description: "" }, 
    int: { description: "" }, 
    interface: { description: "" },
    line: { description: "" }, 
    lineadj: { description: "" }, 
    linear: { description: "" }, 
    LineStream: { description: "" },
    matrix: { description: "" }, 
    min16float: { description: "" }, 
    min10float: { description: "" }, 
    min16int: { description: "" }, 
    min12int: { description: "" }, 
    min16uint: { description: "" },
    namespace: { description: "" }, 
    nointerpolation: { description: "" }, 
    noperspective: { description: "" }, 
    NULL: { description: "" },
    out: { description: "" }, 
    OutputPatch: { description: "" },
    packoffset: { description: "" }, 
    pass: { description: "" }, 
    pixelfragment: { description: "" }, 
    PixelShader: { description: "" }, 
    point: { description: "" }, 
    PointStream: { description: "" }, 
    precise: { description: "" },
    RasterizerState: { description: "" }, 
    RenderTargetView: { description: "" }, 
    return: { description: "" }, 
    register: { description: "" }, 
    row_major: { description: "" }, 
    RWBuffer: { description: "" }, 
    RWByteAddressBuffer: { description: "" }, 
    RWStructuredBuffer: { description: "" }, 
    RWTexture1D: { description: "" }, 
    RWTexture1DArray: { description: "" }, 
    RWTexture2D: { description: "" }, 
    RWTexture2DArray: { description: "" }, 
    RWTexture3D: { description: "" },
    sample: { description: "" }, 
    sampler: { description: "" }, 
    SamplerState: { description: "" }, 
    SamplerComparisonState: { description: "" }, 
    shared: { description: "" }, 
    snorm: { description: "" }, 
    stateblock: { description: "" }, 
    stateblock_state: { description: "" }, 
    static: { description: "" }, 
    string: { description: "" }, 
    struct: { description: "" }, 
    switch: { description: "" }, 
    StructuredBuffer: { description: "" },
    tbuffer: { description: "" }, 
    technique: { description: "" }, 
    technique10: { description: "" }, 
    technique11: { description: "" }, 
    texture: { description: "" }, 
    Texture1D: { description: "" }, 
    Texture1DArray: { description: "" }, 
    Texture2D: { description: "" }, 
    Texture2DArray: { description: "" }, 
    Texture2DMS: { description: "" }, 
    Texture2DMSArray: { description: "" }, 
    Texture3D: { description: "" }, 
    TextureCube: { description: "" }, 
    TextureCubeArray: { description: "" }, 
    true: { description: "" }, 
    typedef: { description: "" }, 
    triangle: { description: "" }, 
    triangleadj: { description: "" }, 
    TriangleStream: { description: "" },
    uint: { description: "" }, 
    uniform: { description: "" }, 
    unorm: { description: "" }, 
    unsigned: { description: "" },
    vector: { description: "" }, 
    vertexfragment: { description: "" }, 
    VertexShader: { description: "" }, 
    void: { description: "" }, 
    volatile: { description: "" },
    while: { description: "" }
};


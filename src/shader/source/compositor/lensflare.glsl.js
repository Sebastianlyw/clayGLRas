export default "@export clay.compositor.lensflare\n#define SAMPLE_NUMBER 8\nuniform sampler2D texture;\nuniform sampler2D lenscolor;\nuniform vec2 textureSize : [512, 512];\nuniform float dispersal : 0.3;\nuniform float haloWidth : 0.4;\nuniform float distortion : 1.0;\nvarying vec2 v_Texcoord;\n@import clay.util.rgbm\nvec4 textureDistorted(\n in vec2 texcoord,\n in vec2 direction,\n in vec3 distortion\n) {\n return vec4(\n decodeHDR(texture2D(texture, texcoord + direction * distortion.r)).r,\n decodeHDR(texture2D(texture, texcoord + direction * distortion.g)).g,\n decodeHDR(texture2D(texture, texcoord + direction * distortion.b)).b,\n 1.0\n );\n}\nvoid main()\n{\n vec2 texcoord = -v_Texcoord + vec2(1.0); vec2 textureOffset = 1.0 / textureSize;\n vec2 ghostVec = (vec2(0.5) - texcoord) * dispersal;\n vec2 haloVec = normalize(ghostVec) * haloWidth;\n vec3 distortion = vec3(-textureOffset.x * distortion, 0.0, textureOffset.x * distortion);\n vec4 result = vec4(0.0);\n for (int i = 0; i < SAMPLE_NUMBER; i++)\n {\n vec2 offset = fract(texcoord + ghostVec * float(i));\n float weight = length(vec2(0.5) - offset) / length(vec2(0.5));\n weight = pow(1.0 - weight, 10.0);\n result += textureDistorted(offset, normalize(ghostVec), distortion) * weight;\n }\n result *= texture2D(lenscolor, vec2(length(vec2(0.5) - texcoord)) / length(vec2(0.5)));\n float weight = length(vec2(0.5) - fract(texcoord + haloVec)) / length(vec2(0.5));\n weight = pow(1.0 - weight, 10.0);\n vec2 offset = fract(texcoord + haloVec);\n result += textureDistorted(offset, normalize(ghostVec), distortion) * weight;\n gl_FragColor = result;\n}\n@end";

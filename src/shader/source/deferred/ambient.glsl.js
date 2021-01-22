export default "@export clay.deferred.ambient_light\nuniform sampler2D gBufferTexture1;\nuniform sampler2D gBufferTexture3;\nuniform vec3 lightColor;\nuniform vec2 windowSize: WINDOW_SIZE;\nvoid main()\n{\n vec2 uv = gl_FragCoord.xy / windowSize;\n vec4 texel1 = texture2D(gBufferTexture1, uv);\n if (dot(texel1.rgb, vec3(1.0)) == 0.0) {\n discard;\n }\n vec3 albedo = texture2D(gBufferTexture3, uv).rgb;\n gl_FragColor.rgb = lightColor * albedo;\n gl_FragColor.a = 1.0;\n}\n@end";

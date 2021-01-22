    //#region setup environment : camera, scene, render, shader, ui config.

    let Shader = clay.Shader;
    let Vector3 = clay.Vector3;
    let m4 = clay.Matrix4;
    let center = new Vector3(0, 1, 0);
    let scene = new clay.Scene();
    let zeroVector = new Vector3();
    let upAxis = new Vector3(0, 1, 0);
    let cubePos = new Vector3(14,0,0);
    let buildingPos = new Vector3(12,-1,2);
    let config = {
        fogEdge: 250,
        fogAmount: 0.3,
        fogColor_R: .2,
        fogColor_G: .4,
        fogColor_B: .5,
        sphere_X : 0,
        sphere_Y : 20,
        sphere_Z : 0
    };
    let gui = new dat.GUI();

    let canvas = document.querySelector("#main");
    let gl = canvas.getContext("webgl");

    // Create render.
    let renderer = new clay.Renderer({
        canvas: document.getElementById('main'),
        devicePixelRatio: 1.0
    });
    renderer.resize(window.innerWidth, window.innerHeight);

    // Create ShadowMap
    let  shadowMapPass = new clay.prePass.ShadowMap({

        softShadow: clay.prePass.ShadowMap.VSM
    });

    // Create camera
    let camera = new clay.camera.Perspective({
        aspect: renderer.getViewportAspect(),
        far: 3000
    });
    camera.position = new Vector3(0, 300, 125);
    camera.lookAt(center);

    //Engine build-in orbit control:
    let control = new clay.plugin.OrbitControl({
        domElement: renderer.canvas,
        target: camera
    });
    //#endregion

    //#region objects in scene.
    // Create a plane terrain.
    // Set segments 30x30 for fog algorithm -> 1800 triangles' vertices will pass to vertex shader for calculating new position in point light space.
    let plane = new clay.geometry.Plane({
        widthSegments: 100,
        heightSegments: 100
    });
    plane.build();
    let planeMesh = new clay.Mesh({
        geometry: plane,
        material: new clay.Material({
            shader: clay.shader.library.get('clay.standard'),
            depthTest: true,
            transparent: true
        })
    });
    let diffuseTex = new clay.Texture2D({
        wrapS: clay.Texture.REPEAT, wrapT: clay.Texture.REPEAT
    });
    diffuseTex.load('textures/grass20.png');
    planeMesh.material.set('diffuseMap', diffuseTex);
    planeMesh.rotation.rotateX(-Math.PI/2);
    planeMesh.scale.set(900, 900, 1);
    planeMesh.position.y = -1;

  //  let modelWorld = mat4();
    //Gui to control fog amount for plane.
    planeMesh.material.define('both','FOG_ENABLED',1);
    function setFogUniform()
    {
        planeMesh.material.set('fogColor', [config.fogColor_R, config.fogColor_G, config.fogColor_B]);//new clay.Vector4(config.fogColor_R,config.fogColor_G, config.fogColor_B, config.fogColor_A));
        planeMesh.material.set('fogEdge', config.fogEdge);
        planeMesh.material.set('fogAmount', config.fogAmount);
    }
    planeMesh.material.set('cameraPosition', [config.sphere_X,config.sphere_Y,config.sphere_Z]);
    setFogUniform();
    function updateFog() {
        setFogUniform();
    }
    gui.add(config, 'fogEdge', -1000, 1000).onChange(updateFog);
    gui.add(config, 'fogAmount', 0, 1).onChange(updateFog);
    gui.add(config, 'fogColor_R', 0, 1).onChange(updateFog);
    gui.add(config, 'fogColor_G', 0, 1).onChange(updateFog);
    gui.add(config, 'fogColor_B', 0, 1).onChange(updateFog);
    scene.add(planeMesh);

    // Generate a sphere
    let sphereCamera = new clay.geometry.Sphere({
        widthSegments: 20,
        heightSegments: 20
    });
    let sphereMesh = new clay.Mesh({
        geometry: sphereCamera,
        material: new clay.Material({
            shader: clay.shader.library.get('clay.standard'),
            transparent : true,
            depthTest:true,
       //     color: [0,2,0] // must call set function after creation.
        })
    });
    sphereMesh.material.set('color', [0, 2, 1]);
    sphereMesh.position = new Vector3(0, 20, 0);
    sphereMesh.scale.set(10, 10, 10);
    scene.add(sphereMesh);
    function updateSphere() {
        sphereMesh.position = new Vector3(config.sphere_X, config.sphere_Y, config.sphere_Z);
    }
    gui.add(config, 'sphere_X', -450, 450).onChange(updateFog);
    gui.add(config, 'sphere_Y', 1, 100).onChange(updateFog);
    gui.add(config, 'sphere_Z', -450, 450).onChange(updateFog);

    //Generate a cube with texture attached.
    let cube = new clay.geometry.Cube();
    cube.generateTangents();
    let shaderStandard = clay.shader.library.get('clay.standard');
    let materialCube = new clay.Material({
        shader: shaderStandard,
    });
    materialCube.set('glossiness', 0.4);
    let diffuse = new clay.Texture2D;
    diffuse.load("example/assets/textures/crate.gif");
    let normal = new clay.Texture2D;
    normal.load("example/assets/textures/normal_map.jpg");
    materialCube.set('diffuseMap', diffuse);
    materialCube.set('normalMap', normal);
    materialCube.enableTexture('diffuseMap');
    materialCube.enableTexture('normalMap');

    let cubeMesh = new clay.Mesh({
        geometry: cube,
        material: materialCube
    });
    cubeMesh.position = cubePos;
    scene.add(cubeMesh);
    //#endregion

    //#region point light & spot lights.
    let pointLight = new clay.light.Point({
        range: 4000,
        position: new Vector3(0,10,0),
        color: [0.3, 0.3, 0.3]
    });

    scene.add(pointLight);
    scene.add(new clay.light.Ambient({
        intensity: 0.15
    }));

    // Create light spot.
    let lightSpot1 = new clay.light.Spot({
        position: new Vector3(cubePos.x -6, cubePos.y + 6 , cubePos.z + 6),
        intensity: 0.8,
        shadowBias: 0.005,
        shadowResolution: 512,
        color: [0.3, 1, 0.3]
    });
    scene.add(lightSpot1);

    let lightSpot2 = new clay.light.Spot({
        position: new Vector3(buildingPos.x + 6,buildingPos.y + 6, buildingPos.z + 6),
        intensity: 0.8,
        shadowBias: 0.005,
        shadowResolution: 512,
        color: [0.3, 0.3, 1.0]
    });
    scene.add(lightSpot2);

    let lightSpot3 = new clay.light.Spot({
        position: new Vector3(buildingPos.x - 6,buildingPos.y + 6, buildingPos.z - 6),
        intensity: 0.8,
        shadowBias: 0.005,
        shadowResolution: 512,
        color: [0.8, 0.3, 0.3]
    });
    scene.add(lightSpot3);
    //#endregion

    //#region Main Loop flow.
    //For main loop
    let timeLine = new clay.Timeline();
    timeLine.start();

    let updateLight = function(){
        lightSpot1.rotateAround(cubePos, upAxis, 0.01);
        lightSpot1.lookAt(cubePos);
        lightSpot2.rotateAround(buildingPos, upAxis, 0.01);
        lightSpot2.lookAt(buildingPos)
        lightSpot3.rotateAround(buildingPos, upAxis, 0.01);
        lightSpot3.lookAt(buildingPos);
    };

    // load gltf model
    let gltfLoader = new clay.loader.GLTF({
        rootNode: new clay.Node()
    });
    //
    gltfLoader.load("Model/asiaArchi/asiaArchi.gltf");
    gltfLoader.on('success', function(res){

        scene.add(gltfLoader.rootNode);
        gltfLoader.rootNode.scale.set(5,5,5);
        gltfLoader.rootNode.position = buildingPos;

        timeLine.on('frame', function(deltaTime) {

            planeMesh.material.setUniform('cameraPosition', [config.sphere_X,config.sphere_Y,config.sphere_Z]);
            control.update(deltaTime);
            sphereMesh.position = new Vector3(config.sphere_X, config.sphere_Y, config.sphere_Z);
            updateLight();
            shadowMapPass.render(renderer, scene, camera);
            renderer.render(scene, camera);
        });
    });
    //#endregion

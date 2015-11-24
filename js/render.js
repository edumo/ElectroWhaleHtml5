//	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

			var container, stats;
			var camera, scene, renderer, materialDepth;

			var sphereMesh = [];
			var SIZE_TABLE = 6;

			var sunPosition = new THREE.Vector3( 0, 1000, -1000 );
			var screenSpacePosition = new THREE.Vector3();

			var mouseX = 0, mouseY = 0;

			var windowHalfX = window.innerWidth / 2;
			var windowHalfY = window.innerHeight / 2;

			var postprocessing = { enabled : true };

			var orbitRadius = 200;

			var bgColor = 0x000511;
			var sunColor = 0xffee00;
			
			var raycaster, mouse;
			var SOUNDERS_SIZE = 2;
			var soundersMesh = [];

		//	init();
		//	animate();
		
		function generateTexture() {

				var canvas = document.createElement( 'canvas' );
				canvas.width = 256;
				canvas.height = 256;

				var context = canvas.getContext( '2d' );
				var image = context.getImageData( 0, 0, 256, 256 );

				var x = 0, y = 0;

				for ( var i = 0, j = 0, l = image.data.length; i < l; i += 4, j ++ ) {

					x = j % 256;
					y = x == 0 ? y + 1 : y;

					image.data[ i ] = 255;
					image.data[ i + 1 ] = 255;
					image.data[ i + 2 ] = 255;
					image.data[ i + 3 ] = Math.floor( x ^ y );

				}

				context.putImageData( image, 0, 0 );

				return canvas;

			}

			function initRender() {

				container = document.createElement( 'div' );
				document.body.appendChild( container );
				document.body.insertBefore(container, 	document.body.children[0]);
				//

				camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 3000 );
				camera.position.z = 200;

				scene = new THREE.Scene();

				materialDepth = new THREE.MeshDepthMaterial();
			var texture = new THREE.Texture( generateTexture() );
				texture.needsUpdate = true;
				var materialScene = new THREE.MeshBasicMaterial( { color: 0x000000, shading: THREE.FlatShading } );
				var materialSceneRed1 =   new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.SmoothShading, map: texture, transparent: true } )  ;
				var materialSceneRed =   new THREE.MeshBasicMaterial( { color: 0xffaa00, wireframe: true } ) 
				// tree
				var loader = new THREE.OBJLoader();
				loader.load( "js/tree.obj", function ( object ) {

					object.material = materialScene;
					object.position.set( 0, -150, -150 );
					object.scale.multiplyScalar( 400 );
					scene.add( object );

				} );

				// sphere
				var geo =  new THREE.CylinderGeometry( 0, 5, 25, 30, 5 );
				var object = new THREE.Mesh( new THREE.TetrahedronGeometry( 155, 0 ), materialScene );
				//var geo = new THREE.TetrahedronGeometry( 0.5, 20 );
				
				 for(var i=0; i<SIZE_TABLE; i++) {
			   		sphereMesh[i] = new Array(SIZE_TABLE);
			    	for(var j=0; j<SIZE_TABLE; j++) {
			    	//	if(j <NOTES_SIZE / 3)
			    		
					//sphereMesh[i][j] = new THREE.Mesh( new THREE.TetrahedronGeometry( 10, 0 ), materialScene );
						sphereMesh[i][j] = new THREE.Mesh( geo, materialSceneRed );
						
						sphereMesh[i][j].scale.set( 1,1,1 );
						scene.add( sphereMesh[i][j] );
					}
				 }
				 
				 //creamos los sounders 
				 for(var i=0; i<SOUNDERS_SIZE; i++) {
				 	soundersMesh[i] = new THREE.Mesh( new THREE.TorusGeometry( 12, 5, 10, 10 ), materialSceneRed );
				 	scene.add( soundersMesh[i] );
				 }
				 
				renderer = new THREE.WebGLRenderer( { antialias: false } );
				renderer.setClearColor( bgColor );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				container.appendChild( renderer.domElement );

				renderer.autoClear = false;
				renderer.sortObjects = false;

				//

				stats = new Stats();
				container.appendChild( stats.domElement );

				//
				
				raycaster = new THREE.Raycaster();
				mouse = new THREE.Vector2();

				document.addEventListener( 'mousemove', onDocumentMouseMove, false );
				document.addEventListener( 'touchstart', onDocumentTouchStart, false );
				document.addEventListener( 'mousedown', onDocumentMouseStart, false );
				document.addEventListener( 'touchmove', onDocumentTouchMove, false );

				//

				initPostprocessing();

			}

			//

			function onDocumentMouseMove( event ) {

				//mouseX = event.clientX - windowHalfX;
				//mouseY = event.clientY - windowHalfY;
				if ( event.touches){
				mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
				mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
				}
			}

			function onDocumentTouchStart( event ) {

				if ( event.touches.length == 2 ) {

					event.preventDefault();

					mouseX = event.touches[ 0 ].pageX - windowHalfX;
					mouseY = event.touches[ 0 ].pageY - windowHalfY;
			

				} 
				/*else 	if ( event.touches.length == 1 ) {
					event.preventDefault();
					mouse.x = event.touches[ 0 ].pageX - windowHalfX;
					mouse.y = event.touches[ 0 ].pageY - windowHalfY;
				}*/

			}
			
			function onDocumentMouseStart( event ) {

					event.preventDefault();
					mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
					mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

			}

			function onDocumentTouchMove( event ) {

				if ( event.touches.length == 2 ) {

					event.preventDefault();

					mouseX = event.touches[ 0 ].pageX - windowHalfX;
					mouseY = event.touches[ 0 ].pageY - windowHalfY;

				}

			}

			//

			function initPostprocessing() {

				postprocessing.scene = new THREE.Scene();

				postprocessing.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2,  window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
				postprocessing.camera.position.z = 100;

				postprocessing.scene.add( postprocessing.camera );

				var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
				postprocessing.rtTextureColors = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );

				// Switching the depth formats to luminance from rgb doesn't seem to work. I didn't
				// investigate further for now.
				// pars.format = THREE.LuminanceFormat;

				// I would have this quarter size and use it as one of the ping-pong render
				// targets but the aliasing causes some temporal flickering

				postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );

				// Aggressive downsize god-ray ping-pong render targets to minimize cost

				var w = window.innerWidth / 4.0;
				var h = window.innerHeight / 4.0;
				postprocessing.rtTextureGodRays1 = new THREE.WebGLRenderTarget( w, h, pars );
				postprocessing.rtTextureGodRays2 = new THREE.WebGLRenderTarget( w, h, pars );

				// god-ray shaders

				var godraysGenShader = THREE.ShaderGodRays[ "godrays_generate" ];
				postprocessing.godrayGenUniforms = THREE.UniformsUtils.clone( godraysGenShader.uniforms );
				postprocessing.materialGodraysGenerate = new THREE.ShaderMaterial( {

					uniforms: postprocessing.godrayGenUniforms,
					vertexShader: godraysGenShader.vertexShader,
					fragmentShader: godraysGenShader.fragmentShader

				} );

				var godraysCombineShader = THREE.ShaderGodRays[ "godrays_combine" ];
				postprocessing.godrayCombineUniforms = THREE.UniformsUtils.clone( godraysCombineShader.uniforms );
				postprocessing.materialGodraysCombine = new THREE.ShaderMaterial( {

					uniforms: postprocessing.godrayCombineUniforms,
					vertexShader: godraysCombineShader.vertexShader,
					fragmentShader: godraysCombineShader.fragmentShader

				} );

				var godraysFakeSunShader = THREE.ShaderGodRays[ "godrays_fake_sun" ];
				postprocessing.godraysFakeSunUniforms = THREE.UniformsUtils.clone( godraysFakeSunShader.uniforms );
				postprocessing.materialGodraysFakeSun = new THREE.ShaderMaterial( {

					uniforms: postprocessing.godraysFakeSunUniforms,
					vertexShader: godraysFakeSunShader.vertexShader,
					fragmentShader: godraysFakeSunShader.fragmentShader

				} );

				postprocessing.godraysFakeSunUniforms.bgColor.value.setHex( bgColor );
				postprocessing.godraysFakeSunUniforms.sunColor.value.setHex( sunColor );

				postprocessing.godrayCombineUniforms.fGodRayIntensity.value = 0.75;

				postprocessing.quad = new THREE.Mesh(
					new THREE.PlaneBufferGeometry( window.innerWidth, window.innerHeight ),
					postprocessing.materialGodraysGenerate
				);
				postprocessing.quad.position.z = -9900;
				postprocessing.scene.add( postprocessing.quad );

			}

			function animate() {

				requestAnimationFrame( animate, renderer.domElement );

				render();
				stats.update();

			}
			
			function rotateAroundObjectAxis(object, axis, radians) {
			    rotObjectMatrix = new THREE.Matrix4();
			    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
			
			    // old code for Three.JS pre r54:
			    // object.matrix.multiplySelf(rotObjectMatrix);      // post-multiply
			    // new code for Three.JS r55+:
			    object.matrix.multiply(rotObjectMatrix);
			
			    // old code for Three.js pre r49:
			    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
			    // old code for Three.js r50-r58:
			    // object.rotation.setEulerFromRotationMatrix(object.matrix);
			    // new code for Three.js r59+:
			    object.rotation.setFromRotationMatrix(rotObjectMatrix);
			}
			
			
			function rotateAroundObjectAxis2(object, axis, radians, axis2, radians2) {
			    rotObjectMatrix = new THREE.Matrix4();
			    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
			
			    // old code for Three.JS pre r54:
			    // object.matrix.multiplySelf(rotObjectMatrix);      // post-multiply
			    // new code for Three.JS r55+:
			    var   rotObjectMatrix2 = new THREE.Matrix4();
			     rotObjectMatrix2.makeRotationAxis(axis2.normalize(), radians2);
				rotObjectMatrix.multiply(rotObjectMatrix2);

			    // old code for Three.js pre r49:
			    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
			    // old code for Three.js r50-r58:
			    // object.rotation.setEulerFromRotationMatrix(object.matrix);
			    // new code for Three.js r59+:
			    object.rotation.setFromRotationMatrix(rotObjectMatrix);
			}

			function render() {

				var time = Date.now() / 4000;

				var camLateral = new THREE.Vector3();
				var camLateral2 = new THREE.Vector3();
				
				//esto el lookat
				var lookAt = new THREE.Vector3( 0, 0, -1 );
				lookAt.applyQuaternion( camera.quaternion );
				
				camLateral2.copy(lookAt);
				
				camLateral.crossVectors(lookAt,camera.position);
				camLateral2.crossVectors(lookAt,camLateral);
				
				camLateral.normalize();
				camLateral2.normalize();

				camLateral.multiplyScalar(40);	
				camLateral2.multiplyScalar(40);	
				
				lookAt.normalize();
				lookAt.multiplyScalar(200);
					
				 for(var i=0; i<SIZE_TABLE; i++) {
			    	for(var j=0; j<SIZE_TABLE; j++) {
						var sphereMeshUno = sphereMesh[i][j]; 
						//sphereMeshUno.position.x = orbitRadius * Math.cos( time *i);
						//sphereMeshUno.position.z = orbitRadius * Math.sin( time *j) - 100;
						
						var posArea = new THREE.Vector3( 0, 0, 0 );
						//nos ponemos en la camara
						posArea.add(camera.position);
						//ahora nos alejamos ortogonalmente a ella
						posArea.add(lookAt);
						
						var posLateral = new THREE.Vector3( 0, 0, 0 );
						var posLateral2 = new THREE.Vector3( 0, 0, 0 );
						
						posLateral.copy(camLateral);
						posLateral2.copy(camLateral2);
						
						posLateral.multiplyScalar(i-SIZE_TABLE/2 + 0.5);
						posLateral2.multiplyScalar(j-SIZE_TABLE/2 + 0.5);
						
						posArea.add(posLateral);
						posArea.add(posLateral2);
					//	posArea.add(new THREE.Vector3( 10*i, 0, 0 ));
					
					
						var rot = matrix[i][j];
					
					//vamos s sacar el angulo entre horizonte y cámara para saber la rotación de lso elementos
					
					var vector = new THREE.Vector3( 0, 0, -1 );
					vector.applyQuaternion( camera.quaternion );
					var angle = vector.angleTo( new THREE.Vector3( 0, 0, -1 ) );
						
					var xAxisScreen = new THREE.Vector3(1,0,0);
					//rotateAroundObjectAxis(sphereMeshUno, xAxis, angle );
							
					var xAxis = new THREE.Vector3(0,0,1);
							
						if(rot.x == 1)
							rotateAroundObjectAxis2(sphereMeshUno, xAxisScreen, angle, xAxis, 0 );
						else if(rot.x == -1)
							rotateAroundObjectAxis2(sphereMeshUno, xAxisScreen, angle, xAxis, Math.PI );
						else if(rot.y == 1)
							rotateAroundObjectAxis2(sphereMeshUno, xAxisScreen, angle, xAxis, Math.PI/2);
						else if(rot.y == -1)
							rotateAroundObjectAxis2(sphereMeshUno, xAxisScreen, angle, xAxis, -Math.PI/2 );
						
						
						sphereMeshUno.position.copy(posArea);
						
					/*	sphereMeshUno.position.x = i * 30 -  30*4 + lookAt.x;
						sphereMeshUno.position.y = j * 10 -  10*4  + lookAt.y;
						sphereMeshUno.position.z = j * 30 +  + lookAt.z;*/
						
						raycaster.setFromCamera( mouse, camera );

						var intersects = raycaster.intersectObject( sphereMeshUno );

						if ( intersects.length > 0 ) {
							console.log('intersects');	
							
							mouse.x = -1000;
							mouse.y = -1000;
							
							if(rot.x == -1){
								rot.y = 1;
								rot.x = 0;
							}else if(rot.y == 1){
								rot.y = 0;
								rot.x = 1;	
							}else if(rot.x == 1){
								rot.y = -1;
								rot.x = 0;	
							}else if(rot.y == -1){
								rot.y = 0;
								rot.x = -1;	
							}
						}
						
			    	}
				 }
				 
				 for(i=0; i<SOUNDERS_SIZE; i++) {
				 	var posCosa = posCosas[i];
				 	var sphereMesh1 = sphereMesh[posCosa.x][posCosa.y]; 
				 	var sounder = soundersMesh[i];
				 	sounder.position.copy(sphereMesh1.position);
				 }


			//	camera.position.x += ( mouseX - camera.position.x ) * 0.036;
				camera.position.y += ( - ( mouseY ) - camera.position.y ) * 0.036;

				camera.position.x += (  0 - camera.position.x ) * 0.036;
				camera.position.y += ( - (  window.innerHeight/2 ) - camera.position.y ) * 0.036;

			//	camera.lookAt( scene.position );
				camera.lookAt( new THREE.Vector3( 0, 0, 100 ));

				if ( postprocessing.enabled ) {

					// Find the screenspace position of the sun

					screenSpacePosition.copy( sunPosition ).project( camera );

					screenSpacePosition.x = ( screenSpacePosition.x + 1 ) / 2;
					screenSpacePosition.y = ( screenSpacePosition.y + 1 ) / 2;

					// Give it to the god-ray and sun shaders

					postprocessing.godrayGenUniforms[ "vSunPositionScreenSpace" ].value.x = screenSpacePosition.x;
					postprocessing.godrayGenUniforms[ "vSunPositionScreenSpace" ].value.y = screenSpacePosition.y;

					postprocessing.godraysFakeSunUniforms[ "vSunPositionScreenSpace" ].value.x = screenSpacePosition.x;
					postprocessing.godraysFakeSunUniforms[ "vSunPositionScreenSpace" ].value.y = screenSpacePosition.y;

					// -- Draw sky and sun --

					// Clear colors and depths, will clear to sky color

					renderer.clearTarget( postprocessing.rtTextureColors, true, true, false );

					// Sun render. Runs a shader that gives a brightness based on the screen
					// space distance to the sun. Not very efficient, so i make a scissor
					// rectangle around the suns position to avoid rendering surrounding pixels.

					var sunsqH = 0.74 * window.innerHeight; // 0.74 depends on extent of sun from shader
					var sunsqW = 0.74 * window.innerHeight; // both depend on height because sun is aspect-corrected

					screenSpacePosition.x *= window.innerWidth;
					screenSpacePosition.y *= window.innerHeight;

					renderer.setScissor( screenSpacePosition.x - sunsqW / 2, screenSpacePosition.y - sunsqH / 2, sunsqW, sunsqH );
					renderer.enableScissorTest( true );

					postprocessing.godraysFakeSunUniforms[ "fAspect" ].value = window.innerWidth / window.innerHeight;

					postprocessing.scene.overrideMaterial = postprocessing.materialGodraysFakeSun;
					renderer.render( postprocessing.scene, postprocessing.camera, postprocessing.rtTextureColors );

					renderer.enableScissorTest( false );

					// -- Draw scene objects --

					// Colors

					scene.overrideMaterial = null;
					renderer.render( scene, camera, postprocessing.rtTextureColors );

					// Depth

					scene.overrideMaterial = materialDepth;
					renderer.render( scene, camera, postprocessing.rtTextureDepth, true );

					// -- Render god-rays --

					// Maximum length of god-rays (in texture space [0,1]X[0,1])

					var filterLen = 1.0;

					// Samples taken by filter

					var TAPS_PER_PASS = 6.0;

					// Pass order could equivalently be 3,2,1 (instead of 1,2,3), which
					// would start with a small filter support and grow to large. however
					// the large-to-small order produces less objectionable aliasing artifacts that
					// appear as a glimmer along the length of the beams

					// pass 1 - render into first ping-pong target

					var pass = 1.0;
					var stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

					postprocessing.godrayGenUniforms[ "fStepSize" ].value = stepLen;
					postprocessing.godrayGenUniforms[ "tInput" ].value = postprocessing.rtTextureDepth;

					postprocessing.scene.overrideMaterial = postprocessing.materialGodraysGenerate;

					renderer.render( postprocessing.scene, postprocessing.camera, postprocessing.rtTextureGodRays2 );

					// pass 2 - render into second ping-pong target

					pass = 2.0;
					stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

					postprocessing.godrayGenUniforms[ "fStepSize" ].value = stepLen;
					postprocessing.godrayGenUniforms[ "tInput" ].value = postprocessing.rtTextureGodRays2;

					renderer.render( postprocessing.scene, postprocessing.camera, postprocessing.rtTextureGodRays1  );

					// pass 3 - 1st RT

					pass = 3.0;
					stepLen = filterLen * Math.pow( TAPS_PER_PASS, -pass );

					postprocessing.godrayGenUniforms[ "fStepSize" ].value = stepLen;
					postprocessing.godrayGenUniforms[ "tInput" ].value = postprocessing.rtTextureGodRays1;

					renderer.render( postprocessing.scene, postprocessing.camera , postprocessing.rtTextureGodRays2  );

					// final pass - composite god-rays onto colors

					postprocessing.godrayCombineUniforms["tColors"].value = postprocessing.rtTextureColors;
					postprocessing.godrayCombineUniforms["tGodRays"].value = postprocessing.rtTextureGodRays2;

					postprocessing.scene.overrideMaterial = postprocessing.materialGodraysCombine;

					renderer.render( postprocessing.scene, postprocessing.camera );
					postprocessing.scene.overrideMaterial = null;

				} else {

					renderer.clear();
					renderer.render( scene, camera );

				}

			}

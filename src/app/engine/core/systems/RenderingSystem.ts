import { System, Engine, Entity, Family, FamilyBuilder, EngineEntityListener } from '@nova-engine/ecs';
import { WebGLRenderer, PerspectiveCamera, Object3D, DataTexture, PMREMGenerator, sRGBEncoding, Mesh, SphereBufferGeometry, MeshBasicMaterial, Scene, Camera } from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky';
import { SceneComponent, RootComponent, HideableComponent } from '../components';
import { SceneEntity } from '../entities'
import { Listener, EventBus, Subject } from '../events';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RaycastController } from 'src/app/utils/raycast-controller';
import { ThreeEngineEvent } from 'src/app/utils/custom-events';

/**
 * @class RenderingSystem
 * @extends System nova-engine ECS System class
 * @implements EngineEntityListener nova-engine ECS interface
 * A system build to wrap the WebGLRenderer's 'render()' function that draws a THREE.Scene on an html canvas.
 */
class RenderingSystem extends System implements EngineEntityListener, Listener {

  private _canvas: HTMLCanvasElement;
  private _renderer: WebGLRenderer;
  private _renderSettings: { backgroundColor: number }
  private _camera: PerspectiveCamera;

  private _sceneFamily: Family;
  private _hideableFamily: Family;
  private _controls: OrbitControls;
  private _objects: Object3D[] = [];
  private _raycastController: RaycastController;
  private _cast: boolean = false;

  public get camera() { return this._camera};

  /**
   * Creates instance of RenderingSystem. Calls super(), assigns canvas and camera fields.
   * @param canvas Canvas to render to.
   * @param camera Camera's view to render.
   * @param renderSettings Settings for the WebGL renderer instance. Contains a number field for backgroundColor.
   */
  constructor(canvas: HTMLCanvasElement, camera: PerspectiveCamera, renderSettings: any) {
    super();
    this._canvas = canvas;
    this._camera = camera;
    this._renderSettings = renderSettings;
  }

  /**
   * Called when an entity is added to the engine. Adds the entity to the underlying scene.
   * @param entity The entity recently added to the engine.
   */
  public onEntityAdded(entity: Entity): void {
    // If the entity is an instance of a SceneEntity, attach the camera to the scene.
    if(entity instanceof SceneEntity) {
      var scene = entity.getComponent(SceneComponent).scene;
      scene.add(this._camera);
    } else {
      // Entity is not of type SceneEntity
      // If the entity has a RootComponent (meaning it is an entity that contains a THREE.Object3D)
      if(entity.hasComponent(RootComponent)) {
        // Loop through all entites in the family.
        this._sceneFamily.entities.forEach(sceneEntity => {
          // Get reference to the THREE.Object3D
          const obj = entity.getComponent(RootComponent).obj;
          // Add THREE.Object3D to scene
          sceneEntity.getComponent(SceneComponent).scene
            .add(obj);
          // Register in list of THREE.Object3D[]
          this._objects.push(obj);
        });
      }
    }
  }

  /**
   * Called when an entity is removed from the engine. Remvoes the entity from the underlying scene.
   * @param entity The entity recently removed from the engine.
   */
  public onEntityRemoved(entity: Entity): void {
    // If the entity isn't a scene entity
    if(entity !instanceof SceneEntity) {
      // If the entity has a RootComponent
      if(entity.hasComponent(RootComponent)) {
        // Loop through entites in the family
        this._sceneFamily.entities.forEach(sceneEntity => {
          // Remove the entity
          var scene = sceneEntity.getComponent(SceneComponent).scene;
          scene.remove(entity.getComponent(RootComponent).obj);
        });
      }
    }
  }

  /**
   * Called when the system is attached to the engine. Calls super.onAttach(). Builds the scene family and creates the WebGLRenderer.
   * @param engine The engine this system is being attached to.
   */
  public onAttach(engine: Engine) {
    super.onAttach(engine);

    // Builds a family of all entities that contain a SceneComponent.
    this._sceneFamily = new FamilyBuilder(engine).include(SceneComponent).build();
    // All entities with hideable components
    this._hideableFamily = new FamilyBuilder(engine).include(HideableComponent).build();
    // Creates the WebGLRenderer that the rendring system will utilize.
    this._renderer = new WebGLRenderer({
      canvas: this._canvas,
      alpha: false,
      antialias: true,
    });

    try{
      if(this._renderSettings) {
        this._renderer.setClearColor(this._renderSettings.backgroundColor);
      } else throw Error('Render settings null');
    } catch (ex) {
      this._renderer.setClearColor(0x5F5F5F);
    }

    this._controls = new OrbitControls(this._camera, this._canvas);
    this._controls.enablePan = false;
    this._controls.minDistance = 7;
    this._controls.maxDistance = 13;
    this._controls.maxPolarAngle = Math.PI / 2;
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.05;

    // Subscribe to events.
    EventBus.get()
      .subscribe(ThreeEngineEvent.STATECHECK, this)
      .subscribe(ThreeEngineEvent.HIDEOBJECT, this);
  }

  /**
   * Called when the system is detached from the engine. Calls super.onDetach(). Disposes of all scene entities. Clears the renderer instance and disposes of it.
   * @param engine The engine the system is being detached from.
   */
  public onDetach(engine: Engine) {

    // Set renderer to white and clear buffer.
    this._renderer.setClearColor(0xFFFFFF);
    this._renderer.clear();

    // Remvoe THREE.Object3Ds from the THREE.Scene component contained in SceneEntity and dispose of scene.
    this._sceneFamily.entities.forEach(sceneEntity => {
      const scene = sceneEntity.getComponent(SceneComponent).scene;
      this._objects.forEach(obj => {
        scene.remove(obj);
      });
      scene.dispose();
    });

    const gl = this._canvas.getContext('webgl');
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    this._renderer.dispose();

    // Unsubscribe from events
    EventBus.get()
      .unsubscribe('state-check', this);

    // Dispose of renderer and call super.
    // this._renderer.dispose(); This does not work properly
    super.onDetach(engine);
  }

  /**
   * IListener Event Listener implementation.
   * @param topic topic to listen to.
   * @param subject subject of the topic.
   */
  receive(topic: string, subject: Subject) {
    switch (topic) {
      case ThreeEngineEvent.STATECHECK:
        break;
      case ThreeEngineEvent.HIDEOBJECT:
        this.hide(subject.data.name, subject.data.hide);
        break;
      case ThreeEngineEvent.MOUSECLICK:
        this._cast = true;
        break;
    }
  }

  private _skybox_old(): void {
    // Create sky
    const sky = new Sky();
    sky.scale.setScalar(450000);

    var effectController = {
      turbidity: 10,
      rayleigh: 2,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
      luminance: 1,
      inclination: 0.7457, // elevation / inclination
      azimuth: 0.659, // Facing front,
      sun: ! true
    };

    // Add Sun Helper
    const sunSphere = new Mesh(
      new SphereBufferGeometry(20000, 16, 8),
      new MeshBasicMaterial({ color: 0xffffff })
    );
    sunSphere.position.y = - 700000;
    sunSphere.visible = false;

    var uniforms = sky.material.uniforms;
    uniforms[ "turbidity" ].value = effectController.turbidity;
    uniforms[ "rayleigh" ].value = effectController.rayleigh;
    uniforms[ "mieCoefficient" ].value = effectController.mieCoefficient;
    uniforms[ "mieDirectionalG" ].value = effectController.mieDirectionalG;
    uniforms[ "luminance" ].value = effectController.luminance;

    const theta = Math.PI * ( effectController.inclination - 0.5 );
    const phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );

    const distance = 400000;
    sunSphere.position.x = distance * Math.cos( phi );
    sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
    sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );

    sunSphere.visible = effectController.sun;

    uniforms[ "sunPosition" ].value.copy( sunSphere.position );

    this._sceneFamily.entities.forEach(sceneEntity => {
      const scene = sceneEntity.getComponent(SceneComponent).scene;
      scene.add(sky, sunSphere);
    })
    //this._addToScene(sky);
  }

  private hide(name: string, hide: boolean) {
    this._hideableFamily.entities.forEach(entity => {
      entity.getComponent(HideableComponent).hide(name, hide);
    });
  }

  /**
   * Resizes the canvas to fill the browser window.
   */
  public resizeToWindow(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.resize(width, height);
  }

  /**
   * Resizes the canvas to fill the canvas renderer element.
   */
  public resizeToContainer(): void {
    const canvas = this._canvas;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.resize(width, height);
  }

  /**
   * Resizes the canvas to the height and width parameters.
   * @param width width to resize to in pixels.
   * @param height height to resize to in pixels.
   */
  public resize(width: number, height: number) : void {
    if(width !== this._canvas.width || height !== this._canvas.height) {
      this._renderer.setSize(width, height, false);
      this._camera.aspect = width / height;
      this._camera.updateProjectionMatrix();
    }
  }

  public attachRaycaster(raycastController: RaycastController) {
    this._raycastController = raycastController;
    this._raycastController.attachCamera(this._camera);
    this._raycastController.attachCanvas(this._canvas);
    EventBus.get().subscribe(ThreeEngineEvent.MOUSECLICK, this);
  }

  public detachRaycaster() {
    this._raycastController = null;
    EventBus.get().unsubscribe(ThreeEngineEvent.MOUSECLICK, this);
  }

  /**
   * The update loop for the RenderingSystem. Calls the WebGLRenderer's render() function. Extra system logic goes here.
   * @param engine The engine this system is running in.
   * @param delta The time delta since last update.
   */
  public update(engine: Engine, delta: number): void {

    // Update camera controls since damping is enabled.f
    this._controls.update();

    if(this._cast && this._raycastController) {
      var intersects = this._raycastController.raycast();
      if(intersects) {
        if(intersects.length > 0) {
          var sub = new Subject();
          sub.data = intersects
          EventBus.get().publish(ThreeEngineEvent.INTERSECT, sub);
        }
      }
      this._cast = false;
    }

    // Check if family is initialized
    if(this._sceneFamily) {
      // For each entity in the family (Entities that contain SceneComponent)
      for(const entity of this._sceneFamily.entities) {
        // Call the render function and pass in the entity's scene and camera
        this._renderer.render(
          entity.getComponent(SceneComponent).scene,
          this._camera
          );
      }
    }
  }

}

export { RenderingSystem };

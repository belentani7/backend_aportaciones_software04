import bpy

# Blender Python script for Veridian Verve Diamond Experience
# Creates a crystalline diamond, emerald green Veridian lighting, and camera setup

print("Setting up Veridian Verve Diamond scene...")

# Clear existing objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Add a Icosphere representing a faceted gem / diamond
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=2.0, location=(0, 0, 0))
diamond = bpy.context.active_object
diamond.name = "Verve_Diamond"

# Add Glass / Crystalline Material with Veridian Green Emission
mat = bpy.data.materials.new(name="Veridian_Crystal")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links

# Clear default nodes
nodes.clear()

# Add Principled BSDF
node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
node_bsdf.inputs['IOR'].default_value = 2.417 # Diamond IOR
node_bsdf.inputs['Roughness'].default_value = 0.05
node_bsdf.inputs['Transmission Weight'].default_value = 0.95
node_bsdf.inputs['Base Color'].default_value = (0.05, 0.8, 0.4, 1.0) # Veridian Green

# Add Emission for inner glow
node_emit = nodes.new(type='ShaderNodeEmission')
node_emit.inputs['Color'].default_value = (0.1, 0.9, 0.5, 1.0)
node_emit.inputs['Strength'].default_value = 2.0

# Add Mix Shader
node_mix = nodes.new(type='ShaderNodeAddShader')

node_output = nodes.new(type='ShaderNodeOutputMaterial')

links.new(node_bsdf.outputs['BSDF'], node_mix.inputs[0])
links.new(node_emit.outputs['Emission'], node_mix.inputs[1])
links.new(node_mix.outputs['Shader'], node_output.inputs['Surface'])

diamond.data.materials.append(mat)

# Add Camera
bpy.ops.object.camera_add(location=(0, -7, 2))
cam = bpy.context.active_object
cam.rotation_euler = (1.15, 0, 0)
bpy.context.scene.camera = cam

# Add Veridian Green Lighting
bpy.ops.object.light_add(type='AREA', location=(0, -4, 5))
light1 = bpy.context.active_object
light1.data.energy = 1000.0
light1.data.color = (0.2, 1.0, 0.6)

bpy.ops.object.light_add(type='POINT', location=(3, 3, 3))
light2 = bpy.context.active_object
light2.data.energy = 500.0
light2.data.color = (0.1, 0.8, 0.4)

print("Veridian Verve Blender scene generated successfully.")

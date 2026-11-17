"""
create_avatar.py  —  builds a stylised, RIGGED 3D avatar in Blender and exports it as GLB.

HOW TO RUN (Blender 3.6 / 4.x):
  1. Open Blender  ->  top tabs  ->  "Scripting".
  2. Click "Open", choose this file, then press the ▶ (Run Script) button.
  3. The avatar appears, with an armature (skeleton) and two animations: "Idle" and "Wave".
  4. Files are saved to the OUTPUT_DIR below:
        avatar.blend  (Blender source file — submit this)
        avatar.glb    (web model — copy to  public/assets/models/avatar.glb)

Then CUSTOMISE it so it looks like you (see docs/AVATAR_GUIDE.md): skin / hair / hoodie
colours are in the COLORS dictionary below, or change them in the Material tab and
re-export with  File -> Export -> glTF 2.0 (.glb).
"""

import bpy
import os
from math import radians
from mathutils import Quaternion, Vector

# ------------------------------------------------------------------ settings
OUTPUT_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "portfolio-avatar")

COLORS = {                        # (R, G, B) from 0 to 1  — change these to look like you
    "skin":   (0.80, 0.56, 0.40),
    "hair":   (0.05, 0.03, 0.02),
    "hoodie": (0.43, 0.30, 1.00),   # purple, matches the website accent
    "pants":  (0.08, 0.08, 0.14),
    "shoes":  (0.95, 0.95, 0.95),
    "eye":    (1.00, 1.00, 1.00),
    "pupil":  (0.02, 0.02, 0.03),
}

# ------------------------------------------------------------------ helpers
def clear_scene():
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.armatures, bpy.data.actions):
        for block in list(coll):
            if block.users == 0:
                coll.remove(block)


def material(name, rgb, roughness=0.5):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def finish(obj, name, mat, smooth=True):
    obj.name = name
    obj.data.name = name
    obj.data.materials.append(mat)
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    return obj


def sphere(name, mat, loc, radius, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=loc, segments=32, ring_count=16)
    o = bpy.context.active_object
    o.scale = scale
    return finish(o, name, mat)


def cylinder(name, mat, loc, radius, depth, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=loc, rotation=rot, vertices=24)
    o = bpy.context.active_object
    bevel = o.modifiers.new("Bevel", "BEVEL")
    bevel.width = min(radius * 0.4, 0.03)
    bevel.segments = 3
    return finish(o, name, mat)


def cube(name, mat, loc, scale):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    bevel = o.modifiers.new("Bevel", "BEVEL")
    bevel.width = 0.03
    bevel.segments = 3
    return finish(o, name, mat)


# ------------------------------------------------------------------ 1. model
def build_body():
    m = {k: material(k.capitalize(), v, 0.35 if k in ("eye", "shoes") else 0.6) for k, v in COLORS.items()}
    parts = {}  # object -> bone name
    # character faces -Y (Blender front view), Z is up, character's LEFT is +X

    for side, x in (("L", 0.15), ("R", -0.15)):
        parts[cylinder(f"Leg.{side}", m["pants"], (x, 0, 0.47), 0.11, 0.78)] = f"Thigh.{side}"
        parts[cube(f"Shoe.{side}", m["shoes"], (x, -0.05, 0.06), (0.22, 0.36, 0.12))] = f"Shin.{side}"

    parts[sphere("Torso", m["hoodie"], (0, 0, 1.15), 1.0, (0.38, 0.25, 0.5))] = "Spine"
    parts[cylinder("Hood", m["hoodie"], (0, 0.05, 1.6), 0.17, 0.12)] = "Spine"
    parts[cylinder("Neck", m["skin"], (0, 0, 1.64), 0.08, 0.16)] = "Neck"

    parts[sphere("Head", m["skin"], (0, 0, 1.87), 0.27)] = "Head"
    parts[sphere("Hair", m["hair"], (0, 0.02, 2.0), 0.285, (1.05, 1.05, 0.6))] = "Head"
    parts[sphere("Nose", m["skin"], (0, -0.27, 1.84), 0.03)] = "Head"
    parts[sphere("Mouth", m["pupil"], (0, -0.255, 1.76), 1.0, (0.06, 0.012, 0.015))] = "Head"
    for side, x in (("L", 0.09), ("R", -0.09)):
        parts[sphere(f"Eye.{side}", m["eye"], (x, -0.235, 1.9), 0.04)] = "Head"
        parts[sphere(f"Pupil.{side}", m["pupil"], (x, -0.268, 1.9), 0.02)] = "Head"
        parts[sphere(f"Ear.{side}", m["skin"], (x * 3.0, 0, 1.87), 0.06, (0.5, 1, 1))] = "Head"

    for side, s in (("L", 1), ("R", -1)):
        parts[sphere(f"Shoulder.{side}", m["hoodie"], (0.36 * s, 0, 1.45), 0.12)] = "Spine"
        parts[cylinder(f"UpperArm.{side}", m["hoodie"], (0.58 * s, 0, 1.45), 0.08, 0.34, (0, radians(90), 0))] = f"UpperArm.{side}"
        parts[cylinder(f"Forearm.{side}", m["hoodie"], (0.89 * s, 0, 1.45), 0.072, 0.32, (0, radians(90), 0))] = f"Forearm.{side}"
        parts[sphere(f"Hand.{side}", m["skin"], (1.08 * s, 0, 1.45), 0.08)] = f"Forearm.{side}"
    return parts


# ------------------------------------------------------------------ 2. rig (armature)
BONES = [  # name, head, tail, parent
    ("Hips", (0, 0, 0.85), (0, 0, 1.1), None),
    ("Spine", (0, 0, 1.1), (0, 0, 1.55), "Hips"),
    ("Neck", (0, 0, 1.55), (0, 0, 1.7), "Spine"),
    ("Head", (0, 0, 1.7), (0, 0, 2.15), "Neck"),
    ("UpperArm.L", (0.42, 0, 1.45), (0.74, 0, 1.45), "Spine"),
    ("Forearm.L", (0.74, 0, 1.45), (1.12, 0, 1.45), "UpperArm.L"),
    ("UpperArm.R", (-0.42, 0, 1.45), (-0.74, 0, 1.45), "Spine"),
    ("Forearm.R", (-0.74, 0, 1.45), (-1.12, 0, 1.45), "UpperArm.R"),
    ("Thigh.L", (0.15, 0, 0.85), (0.15, 0, 0.45), "Hips"),
    ("Shin.L", (0.15, 0, 0.45), (0.15, 0, 0.05), "Thigh.L"),
    ("Thigh.R", (-0.15, 0, 0.85), (-0.15, 0, 0.45), "Hips"),
    ("Shin.R", (-0.15, 0, 0.45), (-0.15, 0, 0.05), "Thigh.R"),
]


def build_rig(parts):
    bpy.ops.object.select_all(action="DESELECT")  # only the rig may enter Edit Mode
    arm_data = bpy.data.armatures.new("AvatarRig")
    rig = bpy.data.objects.new("Avatar", arm_data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    arm_data.display_type = "STICK"
    rig.show_in_front = True

    bpy.ops.object.mode_set(mode="EDIT")
    for name, head, tail, parent in BONES:
        b = arm_data.edit_bones.new(name)
        b.head, b.tail = Vector(head), Vector(tail)
        if parent:
            b.parent = arm_data.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")

    # attach every body part to its bone (rigid "bone parenting", keeps world position)
    bpy.context.view_layer.update()
    for obj, bone in parts.items():
        mw = obj.matrix_world.copy()
        obj.parent = rig
        obj.parent_type = "BONE"
        obj.parent_bone = bone
        bpy.context.view_layer.update()
        obj.matrix_world = mw
    return rig


# ------------------------------------------------------------------ 3. animations
def set_rot(rig, bone, axis, degrees):
    """Rotate a pose bone around a WORLD axis (X/Y/Z), independent of the bone's roll."""
    pb = rig.pose.bones[bone]
    pb.rotation_mode = "QUATERNION"
    rest = pb.bone.matrix_local.to_quaternion()
    world = Quaternion(Vector({"X": (1, 0, 0), "Y": (0, 1, 0), "Z": (0, 0, 1)}[axis]), radians(degrees))
    pb.rotation_quaternion = rest.inverted() @ world @ rest


def key_pose(rig, frame, pose):
    """pose = {bone: [(axis, degrees), ...]}  (bones not listed go back to rest)"""
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = Quaternion()
    for bone, rots in pose.items():
        q = Quaternion()
        for axis, deg in rots:
            set_rot(rig, bone, axis, deg)
            q = rig.pose.bones[bone].rotation_quaternion @ q
        rig.pose.bones[bone].rotation_quaternion = q
    for pb in rig.pose.bones:
        pb.keyframe_insert("rotation_quaternion", frame=frame)


# arms hang down: right arm points -X, so rotating it around +Y by a NEGATIVE angle lowers it
ARMS_DOWN = {
    "UpperArm.R": [("Y", -72)], "Forearm.R": [("Y", -8)],
    "UpperArm.L": [("Y", 72)], "Forearm.L": [("Y", 8)],
}


def make_action(rig, name, frames):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    rig.animation_data.action = action
    for frame, pose in frames:
        key_pose(rig, frame, pose)
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 1, action)
    rig.animation_data.action = None
    return action


def build_animations(rig):
    rig.animation_data_create()
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="POSE")

    def pose(extra):
        p = {k: list(v) for k, v in ARMS_DOWN.items()}
        for k, v in extra.items():
            p[k] = v
        return p

    # Idle: breathing + looking around (loops every 2 seconds at 30 fps)
    make_action(rig, "Idle", [
        (1, pose({"Spine": [("X", 0)], "Head": [("Z", -6)]})),
        (30, pose({"Spine": [("X", -3)], "Head": [("Z", 6), ("X", -3)],
                   "UpperArm.R": [("Y", -69)], "UpperArm.L": [("Y", 69)]})),
        (60, pose({"Spine": [("X", 0)], "Head": [("Z", -6)]})),
    ])

    # Wave: raise right arm and wave the forearm
    up = lambda fore, head=8: pose({"UpperArm.R": [("Y", 60)], "Forearm.R": [("Y", fore)],
                                    "Head": [("Y", head)], "Spine": [("Z", -5)]})
    make_action(rig, "Wave", [
        (1, pose({})),
        (10, up(25)),
        (17, up(75)),
        (24, up(25)),
        (31, up(75)),
        (38, up(25)),
        (45, up(75, 4)),
        (52, up(25)),
        (62, pose({})),
    ])

    # show Idle in the viewport
    rig.animation_data.action = bpy.data.actions["Idle"]
    bpy.ops.object.mode_set(mode="OBJECT")


# ------------------------------------------------------------------ 4. scene, save, export
def stage():
    scene = bpy.context.scene
    scene.render.fps = 30
    scene.frame_start, scene.frame_end = 1, 62
    bpy.ops.object.camera_add(location=(0, -6.5, 1.3), rotation=(radians(88), 0, 0))
    scene.camera = bpy.context.active_object
    bpy.ops.object.light_add(type="SUN", location=(3, -4, 6))
    bpy.context.active_object.data.energy = 3
    bpy.ops.object.light_add(type="AREA", location=(-3, 2, 3))
    bpy.context.active_object.data.energy = 300


def save_and_export():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    blend = os.path.join(OUTPUT_DIR, "avatar.blend")
    glb = os.path.join(OUTPUT_DIR, "avatar.glb")
    bpy.ops.wm.save_as_mainfile(filepath=blend)

    bpy.ops.object.select_all(action="DESELECT")
    kwargs = dict(filepath=glb, export_format="GLB", export_animations=True, export_yup=True, export_apply=True)
    try:
        bpy.ops.export_scene.gltf(**kwargs, export_animation_mode="ACTIONS")
    except TypeError:  # older Blender versions
        bpy.ops.export_scene.gltf(**kwargs)
    print(f"\n✔ Saved {blend}\n✔ Exported {glb}\n  Copy avatar.glb to  portfolio-3d/public/assets/models/avatar.glb\n")


if __name__ == "__main__":
    clear_scene()
    parts = build_body()
    rig = build_rig(parts)
    build_animations(rig)
    stage()
    save_and_export()

# Module 2: Custom 3D Avatar (Blender)

## A. Generate the base avatar (5 minutes)
1. Install **Blender 4.x** (free: blender.org).
2. Open Blender → top tab **Scripting** → **Open** → choose `blender/create_avatar.py` → press **▶ Run Script**.
3. A rigged character appears with a skeleton (armature) and two animations: **Idle** and **Wave**.
4. Two files are saved to `Desktop/portfolio-avatar/`:
   - `avatar.blend` — Blender source file (submit this)
   - `avatar.glb` — web model
5. Copy `avatar.glb` to `public/assets/models/avatar.glb` and refresh the website. The avatar replaces the placeholder and waves when clicked.

> If the script shows an error, copy the red text from **Window → Toggle System Console** (Windows) and send it.

## B. Make it look like YOU (required: "original avatar representing you")
Switch to the **Layout** tab. Click a body part (e.g. *Hair*) and:

| What | How |
|---|---|
| Skin / hair / clothes colour | Right panel → **Material** tab (red ball icon) → **Base Color** |
| Hair style | Select *Hair* → **Tab** (Edit Mode) → move vertices with **G**, scale with **S**; or add spikes with **Sculpt Mode → Grab/Draw** |
| Beard / glasses | **Add → Mesh → Torus** (glasses) or **UV Sphere** (beard) and place it. Attach it to the head so it moves with it: click the new object, **Shift-click** the skeleton (*Avatar*), press **Ctrl+Tab** (Pose Mode), click the **Head** bone, then **Ctrl+P → Bone** |
| Face details | Eyebrows: **Add → Mesh → Cube**, scale thin (**S**, then **S Z**), dark material, parent to **Head** bone |
| Body shape | Select the part → **S** to scale (e.g. taller *Torso*) |
| Logo on hoodie | **Add → Text**, type initials, **Object → Convert → Mesh**, parent to the **Spine** bone |

Tips: middle mouse = orbit, scroll = zoom, numpad **1** = front view, **Ctrl+Z** = undo.

## C. Check the rig and animations
1. Click the skeleton (*Avatar*) → top switch **Pose Mode** → click an arm bone → **R** to rotate. This proves the rig works (good screenshot for the report).
2. **Dope Sheet → Action Editor**: choose *Idle* or *Wave* and press **Space** to play.
3. Want your own gesture (e.g. thumbs-up)? Click **New** in the Action Editor, name it `Thumbs`, pose bones and press **I** to insert keyframes at different frames.

## D. Export to the web (after customising)
**File → Export → glTF 2.0 (.glb/.gltf)** with:
- Format: **glTF Binary (.glb)**
- Include: leave defaults
- Transform: **+Y Up** ✅
- Data → Mesh: **Apply Modifiers** ✅
- Animation: ✅ enabled, **Mode: Actions**

Save as `avatar.glb`, copy to `public/assets/models/`, then save the `.blend` (**Ctrl+S**).

Keep the bone named **Head** — the website uses it to make the head follow the mouse. Animations whose name contains *idle* loop; *wave* plays when the avatar is clicked.

## E. Screenshots for the report
1. Solid view of the avatar (front)
2. Pose Mode with the skeleton visible
3. Material tab showing your colours
4. Action Editor with *Idle* / *Wave*
5. The avatar on the website

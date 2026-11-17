<!--
  EXTRA KNOWLEDGE FOR THE CHATBOT
  ---------------------------------
  Every .md / .txt file in data/knowledge/ is added to the RAG index.
  Paste your full CV text here (or add more files like fyp.md, internship.md).
  - The first "# Heading" becomes the source title shown in citations.
  - The anchor comment below decides which website section a citation links to.
  - "## Sub-headings" split the file into separate searchable chunks.
  - Lines containing the word TODO are ignored, so the bot never repeats placeholders.
  After editing run:  npm run build-index
-->
<!-- anchor: #about -->
# Curriculum Vitae

## Summary
Muhammad Basim (Roll No. GA-23039) is a BS Computer Science (Gaming & Animation) student at NED University of Engineering & Technology, Karachi, Pakistan. He is interested in game development, computer graphics, 3D modelling and animation, and AI.

## Contact
Email: basim4630086@cloud.neduet.edu.pk

## Courses
Courses include CT-384 Graphics Design (OpenGL / GLUT) and AI & Expert Systems (AIES).

## Skills
Main programming languages: C++ and Python. Also uses OpenGL/GLUT for graphics, Blender for 3D modelling, After Effects for motion graphics, and HTML, CSS, JavaScript and Three.js for this web portfolio.

## Spider Game project
The Spider Game was built in C++ with OpenGL and GLUT for the CT-384 Graphics Design Complex Computing Activity (CCA). The player controls a house with a cannon on its roof and shoots spiders before they reach the house.
Controls: Left/Right arrows or A/D move the house, Up/Down or W/S rotate the cannon, SPACE or mouse click shoots, and the mouse can also aim. P pauses, M toggles sound, R restarts.
There are three spider types: small spiders (1 point), purple spiders (2 points) and big black widows that need 3 hits and give 5 points. Spiders move with bounce, zig-zag, silk-thread drop and chase patterns, using velocity from speed and direction (dx = s·cos(theta)·elapsed time) and bouncing off the screen edges.
The game uses circle collision detection (distance < r1 + r2), glutTimerFunc for a 60 FPS animation loop, glPushMatrix/glTranslatef/glRotatef for sprite transformations, Easy/Medium/Hard difficulty, level progression, lives, a high score saved to a file, sound effects, particle explosions and a night-sky background with a moon, stars and cobwebs.

## Languages
English and Urdu.

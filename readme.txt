The game I wanted to make was pong but with the rule that the ball has to be
not hitting the walls to score points. I had a hard time understanding how to make
the ball and the paddles work nicely with each other in terms of collision and moving
but I eventually figured out some hackneyed solution. 

The server handles the movement of the ball by changing its values when pinged to do so
from the client; it's not exactly reliable having the client be the trigger to this.
The server also holds the code that directs the bouncing of the ball, but the collision
of ball against paddle is handled by each server. I'm not sure if that was a good idea, 
but it kind of works.

Known issues:
-The ball occasionally will get stuck on a wall when rebounding
-Score does not draw to canvas
-Ball size does not reset when it hits the wall

I do not think i did anything above and beyond.

I feel that at the end of this project something clicked and I understand websockets 
much better, as well as how server and clients interact. 


# LaLigaDashboard
Functional dashboard for La Liga soccer league, with advanced statistics.

Displays a live table, upcoming matches, recent matches, and top scorers.
<img width="1499" height="740" alt="Screenshot 2026-09-30 183106" src="https://github.com/user-attachments/assets/33fd1294-a090-4a6a-a780-db73818416a3" />
To select a specific team, click on their name from the table.
Calculates rolling form average, home field advantage by home win % vs away win %, and goals scored vs against for each team.

Rolling form is calculated by the following:
70 for a win, 42 for a draw, 15 for a loss as the base points. For the goal differential, each +GD is +5 points (2-0 result means +2 GD, +10 points)
On top of this, up to 8 points are added based on strength of opponent (current table standings), and away games add +3.
Strength of opponent is by CURRENT standings, not when they played the game.
These results are then smoothed to an average, you can see their current / past form for each recent matchday.
<img width="1497" height="899" alt="Screenshot 2026-09-30 183815" src="https://github.com/user-attachments/assets/7a24211f-bd6d-451e-be9e-2511934071c9" />

Goal Differential is self explanatory:
For each goal scored, GD goes up by one. For each goal conceded, GD goes down by one. For instance, a 3-1 result means a +2GD, with 3 goals for and 1 goal against.
<img width="1492" height="901" alt="Screenshot 2026-09-30 184101" src="https://github.com/user-attachments/assets/a2ce000b-4603-4f5a-9074-6d1f3763bf0c" />

# Notes
Keep in mind the free tier of football-data.org API limits to 10 requests per minute. You will not go over this limit as long as you don't try to host the site using Main.java more than once per minute.

# laLigaDashboard
Functional dashboard for La Liga soccer league, with advanced statistics.

Displays a live table, upcoming matches, recent matches, and top scorers.
To select a specific team, click on their name from the table.
Calculates rolling form average, home field advantage by home win % vs away win %, and goals scored vs against for each team.

Rolling form is calculated by the following:
70 for a win, 42 for a draw, 15 for a loss as the base points. For the goal differential, each +GD is +5 points (2-0 result means +2 GD, +10 points)
On top of this, up to 8 points are added based on strength of opponent (current table standings), and away games add +3.
Strength of opponent is by CURRENT standings, not when they played the game.
These results are then smoothed to an average, you can see their current / past form for each recent matchday.

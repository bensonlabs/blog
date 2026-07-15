use macroquad::prelude::*;

#[derive(Clone, Copy)]
struct Glyph {
    x: i32,
    y: i32,
    active: bool, // gravity switcher
}

#[derive(Clone, Copy)]
struct Ball {
    x: i32,
    y: i32,
    goal: bool,
}

struct Game {
    glyphs: Vec<Glyph>,
    ball: Ball,
    level: usize,
    levels: Vec<Level>,
}

struct Level {
    glyphs: Vec<Glyph>,
    start: (i32, i32),
    goal: (i32, i32),
}

impl Game {
    fn new() -> Self {
        let levels = vec![
            Level {
                glyphs: vec![
                    Glyph { x: 2, y: 1, active: false },
                    Glyph { x: 3, y: 1, active: false },
                    Glyph { x: 4, y: 1, active: false },
                ],
                start: (0, 1),
                goal: (5, 1),
            },
            Level {
                glyphs: vec![
                    Glyph { x: 2, y: 2, active: true },
                    Glyph { x: 3, y: 1, active: false },
                    Glyph { x: 3, y: 3, active: true },
                ],
                start: (1, 2),
                goal: (4, 2),
            },
        ];
        let first_level = &levels[0];
        Self {
            glyphs: first_level.glyphs.clone(),
            ball: Ball { x: first_level.start.0, y: first_level.start.1, goal: false },
            level: 0,
            levels,
        }
    }

    fn draw(&self) {
        clear_background(BLACK);

        // Draw grid outline (optional ambient)
        for y in 0..4 { for x in 0..6 {
            draw_rectangle(x as f32*50.0, y as f32*50.0, 49.0, 49.0, color_u8!(10, 10, 10, 255));
        }}

        // Draw goal
        let goal = self.levels[self.level].goal;
        draw_rectangle(goal.0 as f32*50.0, goal.1 as f32*50.0, 50.0, 50.0, GREEN);

        // Draw glyphs
        for g in &self.glyphs {
            let col = if g.active { color_u8!(100, 200, 255, 255) } else { color_u8!(220, 220, 255, 255) };
            draw_circle(g.x as f32*50.0+25.0, g.y as f32*50.0+25.0, 20.0, col);
            if g.active { draw_circle_lines(g.x as f32*50.0+25.0, g.y as f32*50.0+25.0, 24.0, 1.0, BLUE); }
        }

        // Draw ball
        draw_circle(self.ball.x as f32*50.0+25.0, self.ball.y as f32*50.0+25.0, 15.0, YELLOW);
        if self.ball.goal { draw_circle(self.ball.x as f32*50.0+25.0, self.ball.y as f32*50.0+25.0, 22.0, color_u8!(0, 255, 200, 180)); }
    }

    fn update(&mut self) {
        if is_key_pressed(KeyCode::Space) {
            self.glyphs_mut().iter_mut().for_each(|g| g.active = !g.active);
        }
        if self.ball.goal && is_key_pressed(KeyCode::Enter) {
            self.level = (self.level + 1) % self.levels.len();
            let lvl = &self.levels[self.level];
            self.glyphs = lvl.glyphs.clone();
            self.ball = Ball { x: lvl.start.0, y: lvl.start.1, goal: false };
        }
    }

    fn glyphs_mut(&mut self) -> &mut Vec<Glyph> { &mut self.glyphs }
}
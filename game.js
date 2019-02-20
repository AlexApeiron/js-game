'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('передан неправильный агрумент, нужен вектор');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}

class Actor {
  constructor(
    pos = new Vector(0, 0),
    size = new Vector(1, 1),
    speed = new Vector(0, 0)
  ) {
    if (
      !(
        pos instanceof Vector &&
        size instanceof Vector &&
        speed instanceof Vector
      )
    ) {
      throw new Error('передан неправильный агрумент, нужен вектор');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  get left() {
    return this.pos.x;
  }
  get top() {
    return this.pos.y;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }
  get type() {
    return 'actor';
  }

  act() {}

  isIntersect(test) {
    if (!(test instanceof Actor)) {
      throw new Error('передан неправильный агрумент, нужен Actor');
    }
    if (this === test) {
      return false;
    }
	
    return (
      this.left < test.right &&
      this.right > test.left &&
      this.bottom > test.top &&
      this.top < test.bottom
    );
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = actors.find(el => el.type === 'player');
    this.height = grid.length;
    const grlen = grid.map(el => el.length);
    this.width = Math.max(...grlen, 0);
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('передан неправильный агрумент, нужен Actor');
    }
    return this.actors.find(el => actor.isIntersect(el));
  }

  obstacleAt(pos, size) {
    if (!(pos instanceof Vector && size instanceof Vector)) {
      throw new Error('передан неправильный агрумент, нужен вектор');
    }
    if (pos.y + size.y > this.height) {
      return 'lava';
    }
    if (pos.y < 0 || pos.x + size.x > this.width || pos.x < 0) {
      return 'wall';
    }
	
    const x0 = Math.floor(pos.x);
    const xn = Math.ceil(pos.x + size.x);
    const y0 = Math.floor(pos.y);
    const yn = Math.ceil(pos.y + size.y);
    for (let x = x0; x < xn; x++) {
      for (let y = y0; y < yn; y++) {
        if (this.grid[y][x]) {
          return this.grid[y][x];
        }
      }
    }
  }

  removeActor(actor) {
    for (let i = 0; i < this.actors.length; i++) {
      if (actor === this.actors[i]) {
        this.actors.splice(i, 1);
        break;
      }
    }
  }

  noMoreActors(type) {
    function testType(test) {
      return test.type === type;
    }
    return !this.actors.some(testType);
  }

  playerTouched(type, actor) {
    if (this.status === null) {
      if (type === 'lava' || type === 'fireball') {
        this.status = 'lost';
      } else if (type === 'coin') {
        this.removeActor(actor);
        if (this.noMoreActors('coin')) {
          this.status = 'won';
        }
      }
    }
  }
}

class LevelParser {
  constructor(dictionary = {}) {
    this.dictionary = dictionary;
  }

  actorFromSymbol(sym) {
    return this.dictionary[sym];
  }

  obstacleFromSymbol(sym) {
    if (sym == 'x') {
      return 'wall';
    }
    if (sym == '!') {
      return 'lava';
    }
  }

  createGrid(grid) {
    grid = grid.map(y => y.split('').map(x => this.obstacleFromSymbol(x)));
    return grid;
  }

  createActors(actors) {
    const arr = [];
    for (let y = 0; y < actors.length; y++) {
      for (let x = 0; x < actors[y].length; x++) {
        const newActor = this.actorFromSymbol(actors[y][x]);
        if (typeof newActor === 'function') {
          const item = new newActor(new Vector(x, y));
          if (item instanceof Actor) {
            arr.push(item);
          }
        }
      }
    }
    return arr;
  }

  parse(grid) {
    return new Level(this.createGrid(grid), this.createActors(grid));
  }
}

class Fireball extends Actor {
  constructor(pos, speed) {
    super(pos, new Vector(1, 1), speed);
  }
  get type() {
    return 'fireball';
  }

  getNextPosition(t = 1) {
    return this.pos.plus(this.speed.times(t));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(t, level) {
    const next = this.getNextPosition(t);
    if (level.obstacleAt(next, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = next;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.startpos = pos;
  }

  handleObstacle() {
    this.pos = this.startpos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.startPos = this.pos;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * (2 * Math.PI);
  }

  get type() {
    return 'coin';
  }

  updateSpring(t = 1) {
    this.spring = this.spring + this.springSpeed * t;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(t = 1) {
    this.updateSpring(t);
    return this.startPos.plus(this.getSpringVector());
  }

  act(t) {
    this.pos = this.getNextPosition(t);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
  }

  get type() {
    return 'player';
  }
}

const actorDict = {
  '@': Player,
  o: Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  v: FireRain
};

const schemas = [
  [
    '         ',
    '         ',
    '    =    ',
    '       o ',
    '     !xxx',
    ' @       ',
    'xxx!     ',
    '         '
  ],
  [
    '      v  ',
    '    v    ',
    '  v      ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '         '
  ]
];

const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay).then(() =>
  console.log('Вы выиграли приз!')
);
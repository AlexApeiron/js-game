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
    return new Vector(this.x + vector.x, this.y + vector.y);;
  }

  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}


class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!((pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector))) {
      throw new Error('передан неправильный агрумент, нужен вектор');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }
  
  get left(){
	return this.pos.x;  
  }
  get top(){
	return this.pos.y;  
  }
  get right(){
    return this.pos.x + this.size.x;
  }
  get bottom(){
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
    // эту проверку можно убрать
    if ((test.size.x < 0) || (test.size.y < 0)) {
      return false;
    }
    // условие можно упростить
    // если переданный объект выше, ниже, левее или правее,
    // то он не пересекается с данным
    const res = (this.left <= test.left) && (test.left < this.right) || (this.left < test.right) && (test.right <= this.right);
    return (this.top <= test.top) && (test.top < this.bottom) && res || (this.top < test.bottom) && (test.bottom <= this.bottom) && res;
  }
}


class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    // тут нужно использовать метод для поиска объектов в массиве
    for (let i = 0; i < actors.length; i++) {
      // всегда используйте === или !==
      if (actors[i].type == 'player') {
        this.player = actors[i];
        break;
      }
    }
    // ===
    // вообще эта праверка тут лишняя
    if (grid.length == 0) {
      this.height = 0;
    } else {
      this.height = grid.length;
    }
    this.width = 0;
    // здесь лучше использовать reduce или map + Math.max
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] instanceof Array) {
        if (grid[i].length > this.width) {
          this.width = grid[i].length;
        }
      }
    }
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    // !==
    return (this.status != null) && (this.finishDelay < 0);
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('передан неправильный агрумент, нужен Actor');
    }
    // лучше использовать метод для поиска объекта в массиве
    for (let i = 0; i < this.actors.length; i++) {
      if (actor.isIntersect(this.actors[i])) {
        return this.actors[i];
      }
    }
    // лишняя строчка
    return undefined;
  }

  obstacleAt(pos, size) {
    if (!((pos instanceof Vector) && (size instanceof Vector))) {
      throw new Error('передан неправильный агрумент, нужен вектор');
    }
    if ((pos.y + size.y) > this.height) {
      return 'lava';
    }
    if ((pos.y < 0) || ((pos.x + size.x) > this.width) || (pos.x < 0)) {
      return 'wall';
    }
    // лучше записать округлённые значения,
    // чтобы  не округлять на каждой итерации
    for (let x = Math.floor(pos.x); x < Math.ceil(pos.x + size.x); x++) {
      for (let y = Math.floor(pos.y); y < Math.ceil(pos.y + size.y); y++) {
        // тут нужно просто проверить, что ячейка не пустая,
        // иначе придётся исправлять код в нескольких местах,
        // если появится новое препятствие
        // this.grid[y][x] лучше записать в переменную,
        // чтобы неискольо раз не писать
        if ((this.grid[y][x] == 'lava') || (this.grid[y][x] == 'wall')) {
          return this.grid[y][x];
        }
      }
    }
    return undefined;
  }

  removeActor(actor) {
    for (let i = 0; i < this.actors.length; i++) {
      // ===
      if (actor == this.actors[i]) {
        this.actors.splice(i, 1);
        break;
      }
    }
  }

  noMoreActors(type) {
    for (let i = 0; i < this.actors.length; i++) {
      // ===
      if (this.actors[i].type == type) {
        return false;
      }
    }
    return true;
  }

  playerTouched(type, actor) {
    // ===
    // скобки вокруг условий можно опустить
    if ((type == 'lava') || (type == 'fireball')) {
      this.status = 'lost';  
    // статус тут проверять не нужно
    } else if ((type == 'coin') && (this.status != 'lost')) {
      this.removeActor(actor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}


class LevelParser {
  constructor(dictionary) {
    this.dictionary = dictionary;
  }

  actorFromSymbol(sym) {
    // это лишняя проверка
    if (typeof sym === 'undefined') {
      return undefined;
    }
    return this.dictionary[sym];
  }

  obstacleFromSymbol(sym) {
    // это лишняя проверка
    if (typeof sym === 'undefined') {
      return undefined;
    }
    if (sym == 'x') {
      return 'wall';
    }
    if (sym == '!') {
      return 'lava';
    }
    // лишняя строчка
    return undefined;
  }

  createGrid(grid) {
    // этот метод лучше переписать использую метод map
    for (let i = 0; i < grid.length; i++) {
      grid[i] = grid[i].split('');
      for (let j = 0; j < grid[i].length; j++) {
        // дублирование логики obstacleFromSymbol
        if (grid[i][j] == 'x') {
          grid[i][j] = 'wall';
        } else if (grid[i][j] == '!') {
          grid[i][j] = 'lava';
        } else {
          grid[i][j] = undefined;
        }
      }
    }
    return grid;
  }

  createActors(actors) {
    // const
    var arr = [];
    // лучше добавить значение по-умолчанию в конструкторе
    // и не проверять это поле каждый раз перед использованием
    if (typeof this.dictionary === 'undefined') {
      return arr;
    }
    for (let y = 0; y < actors.length; y++) {
      for (let x = 0; x < actors[y].length; x++) {
        // const
        let pos = new Vector(x, y);
        // лишняя проверка
        if (actors[y][x] in this.dictionary) {
          // дублирование логики actorFromSymbol
          if (typeof this.dictionary[actors[y][x]] === 'function') {
            // const
            let item = new this.dictionary[actors[y][x]](pos);
            if (item instanceof Actor) {
              arr.push(item);
            }
          }
        }
      }
    }
    return arr;
  }

  parse(grid) {
    // зачем?
    let actors = grid.slice();
    grid = this.createGrid(grid);
    actors = this.createActors(actors);
    return new Level(grid, actors);
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
    // тут нужно использовать методы класса Vector
    return new Vector(this.pos.x + t * this.speed.x, this.pos.y + t * this.speed.y);
  }

  handleObstacle() {
    // тут нужно использовать метод класса Vector
    this.speed.x = -this.speed.x;
    this.speed.y = -this.speed.y;
  }

  act(t, level) {
    const next = this.getNextPosition(t);
    if (level.obstacleAt(next, this.size)) {
      this.handleObstacle();
    } else {
      // не нужно мутировать объекты класса Vector
      // (менять свойства без создания новго объекта)
      this.pos.x = next.x;
      this.pos.y = next.y;
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
  constructor(pos = new Vector(1, 1)) {
    super(new Vector(pos.x + 0.2, pos.y + 0.1), new Vector(0.6, 0.6));
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
    return new Vector(0, Math.sin(this.spring) * this.springDist);;
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
    // Тут можно вызвать pos.plus
    super(new Vector(pos.x + 0, pos.y - 0.5), new Vector(0.8, 1.5));
  }
  
  get type() {
    return 'player';
  }
}


const actorDict = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
}


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
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));
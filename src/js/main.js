const N = 8
const WH = 100 / N
const TOP_UP = 4
const BOTTOM_FROM = N - 3
const BG_COLORS = {
  red: '#ff0000',
  blue: '#0000ff'
}
const COLORS = {
  checker: {
    light: 'red',
    dark: 'blue'
  },
  cell: {
    true: 'black',
    false: 'white'
  }
}

function Checkers () {
  let self = this

  this.N = N
  this.TURNS = [ COLORS.checker.light, COLORS.checker.dark ]
  this.EAT_MOVE = 'eat'
  this.FREE_MOVE = 'free'

  // 0 - light, 1 - dark
  this.currentTurn = this.TURNS[0]
  this.turnsCount = 0
  this.currentChecker = null

  this.boardDOM = document.getElementById('board')
  this.turnsCountDOM = document.getElementById('turns_count')
  this.turnColorDOM = document.getElementById('current_turn_color')

  this.getCell = (x, y) => {
    const cell = document.getElementById(`cell_${x}_${y}`)
    return cell ? cell.obj : null
  }

  this.getCheckers = (color, marked = false) => {
    let checkers = document.querySelectorAll(`.checker.checker__${color}${marked ? '.marked' : ''}`)
    checkers = Object.keys(checkers).map((i) => (checkers[i] = checkers[i].obj))
    return checkers
  }

  var gameController = {
    LEFT: 0,
    RIGHT: 1,
    moves: {
      [ COLORS.checker.light ]: {
        fw: [
          { x: -1, y: -1 },
          { x: -1, y: 1 }
        ],
        bw: [
          { x: 1, y: -1 },
          { x: 1, y: 1 }
        ]
      },
      [ COLORS.checker.dark ]: {
        fw: [
          { x: 1, y: -1 },
          { x: 1, y: 1 }
        ],
        bw: [
          { x: -1, y: -1 },
          { x: -1, y: 1 }
        ]
      }
    },
    showMoves (moves) {
      if (moves) {
        moves.forEach((move) => {
          if (move && move.cell) {
            move.cell.highlight()
          }
        })
      }
    },
    getAvailableMoves (checker, onlyEat = false) {
      const checkerMoves = this.moves[ checker.color ]
      const enemyEatingFilter = (mv) => mv && mv.cell && mv.type === self.EAT_MOVE
      const freeMoveFilter = (mv) => mv && mv.cell && mv.type === self.FREE_MOVE
      let moves = []
      moves.push(
        this.getAvailableCell(checker, checkerMoves.fw[ this.LEFT ], onlyEat),
        this.getAvailableCell(checker, checkerMoves.fw[ this.RIGHT ], onlyEat),
        this.getAvailableCell(checker, checkerMoves.bw[ this.LEFT ], true),
        this.getAvailableCell(checker, checkerMoves.bw[ this.RIGHT ], true)
      )
      if (moves.some(enemyEatingFilter)) {
        moves = {
          type: self.EAT_MOVE,
          moves: moves.filter(enemyEatingFilter)
        }
      } else {
        moves = {
          type: self.FREE_MOVE,
          moves: moves.filter(freeMoveFilter)
        }
      }
      return moves.moves.length ? moves : null
    },
    getAvailableCell (checker, direction, onlyEat = false) {
      const curPos = checker.cell.getPosition()
      const cell = self.getCell(curPos.x + direction.x, curPos.y + direction.y)
      const cellHasChecker = cell && cell.hasChecker()
      if (!cellHasChecker && !onlyEat) {
        return {
          type: self.FREE_MOVE,
          cell: cell
        }
      }
      if (cellHasChecker && checker.color !== cell.checker.color) {
        return {
          type: self.EAT_MOVE,
          cell: this.cellAfterEating(cell.getPosition(), direction)
        }
      }

      return null
    },
    cellAfterEating (enemyPosition, dirPosition) {
      const cell = self.getCell(enemyPosition.x + dirPosition.x, enemyPosition.y + dirPosition.y)
      return cell && !cell.hasChecker() ? cell : null
    },
    eatIfItPossible (curCell, nextCell) {
      if (Math.abs(curCell.x - nextCell.x) === 2) {
        const direction = this.calcDirectionOfMove(curCell, nextCell)
        const enemyCell = self.getCell(curCell.x + direction.x, curCell.y + direction.y)
        enemyCell.checker.belongsTo(null)
        enemyCell.removeChecker()

        return true
      }
      return false
    },
    calcDirectionOfMove (curCell, nextCell) {
      return {
        x: (nextCell.x - curCell.x) / 2,
        y: (nextCell.y - curCell.y) / 2
      }
    },
    markAvailableCheckers (color) {
      const checkers = self.getCheckers(color)
      let eatMoves = false
      let freeMoves = []
      checkers.forEach((checker) => {
        const moves = this.getAvailableMoves(checker)
        if (moves) {
          if (moves.type === self.EAT_MOVE) {
            checker.mark()
            eatMoves = true
          } else {
            freeMoves.push(checker)
          }
        }
      })
      if (!eatMoves && freeMoves.length) {
        freeMoves.forEach((checker) => checker.mark())
      }
    },
    unmarkCurrentCheckers (color) {
      const checkers = self.getCheckers(color, true)
      checkers.forEach((checker) => checker.unmark())
    },
    setNexnTurn () {
      self.turnsCount++
      self.currentTurn = self.TURNS[ self.turnsCount % 2 ]
    }
  }

  function Cell (x, y) {
    let self = this

    this.x = x
    this.y = y
    this.id = `cell_${x}_${y}`
    this.color = COLORS.cell[ x % 2 === y % 2 ]

    this.checker = null

    this.cellDOM = (() => {
      const cell = document.createElement('div')
      cell.id = self.id
      cell.className = `cell cell__${self.color}`
      cell.style.width = `${WH}%`
      cell.style.height = `${WH}%`
      cell.addEventListener('click', cellClickHandle)
      if (!cell.hasOwnProperty('obj')) {
        cell.obj = self
      }
      return cell
    })()

    // public methods
    this.getPosition = () => {
      return {
        x: self.x,
        y: self.y
      }
    }
    this.containChecker = (checker) => (self.checker = checker)
    this.hasChecker = () => self.checker != null
    this.removeChecker = () => {
      self.cellDOM.removeChild(self.checker.checkerDOM)
      self.checker = null
    }
    this.highlight = () => self.cellDOM.classList.toggle('highlight')
    this.unhighlight = () => self.cellDOM.classList.remove('highlight')
    this.isHighlighted = () => self.cellDOM.classList.contains('highlight')
  }

  function Checker (color) {
    let self = this

    this.color = color
    this.cell = null

    this.checkerDOM = (() => {
      const checker = document.createElement('div')
      checker.className = `checker checker__${self.color}`
      if (!checker.hasOwnProperty('obj')) {
        checker.obj = self
      }
      checker.addEventListener('click', checkerClickHandle)
      return checker
    })()

    // public methods
    this.activate = () => self.checkerDOM.classList.toggle('active')
    this.belongsTo = (cell) => {
      self.cell = cell
      if (cell) {
        cell.cellDOM.appendChild(self.checkerDOM)
      }
    }
    this.canTurn = (currentTurn) => self.color === currentTurn
    this.mark = () => self.checkerDOM.classList.toggle('marked')
    this.unmark = () => self.checkerDOM.classList.remove('marked')
    this.isMarked = () => self.checkerDOM.classList.contains('marked')
    this.isMovePossible = (currentChecker, currentTurn) => {
      return self.canTurn(currentTurn) && self.isMarked() && (currentChecker == null || currentChecker !== self)
    }
    this.moveTo = (cell) => {
      self.cell.removeChecker()
      self.belongsTo(cell)
      cell.containChecker(self)
    }
  }

  function deactivateCheckers () {
    const activeCheckers = document.getElementsByClassName('checker active')
    if (activeCheckers.length) {
      Object.keys(activeCheckers).map((i) => activeCheckers[i].classList.remove('active'))
      var highlights = document.querySelectorAll('.cell.highlight')
      Object.keys(highlights).map((i) => highlights[i].obj.unhighlight())
    }
  }

  function checkerClickHandle (e) {
    const checker = this.obj
    deactivateCheckers()
    if (checker !== undefined && checker.isMovePossible(self.currentChecker, self.currentTurn)) {
      const availableMoves = gameController.getAvailableMoves(checker)
      checker.activate()
      gameController.showMoves(availableMoves.moves)
      self.currentChecker = checker
    } else {
      self.currentChecker = null
    }

    return false
  }

  function cellClickHandle (e) {
    const cell = this.obj
    if (self.currentChecker && cell.isHighlighted()) {
      // console.log('can move to this cell')
      const wasEaten = gameController.eatIfItPossible(self.currentChecker.cell, cell)
      self.currentChecker.moveTo(cell)
      const mustEat = gameController.getAvailableMoves(self.currentChecker, true)
      deactivateCheckers()
      if (wasEaten && mustEat && mustEat.moves) {
        self.currentChecker.activate()
        gameController.showMoves(mustEat.moves)
      } else {
        gameController.unmarkCurrentCheckers(self.currentTurn)
        gameController.setNexnTurn()
        gameController.markAvailableCheckers(self.currentTurn)
      }
      updateInfo()
    } else {
      // console.log('move to this cell is impossible')
    }

    return false
  }

  // drawing board
  function drawBoard () {
    for (let i = 1; i <= self.N; i++) {
      for (let j = 1; j <= self.N; j++) {
        const cell = new Cell(i, j)
        self.boardDOM.appendChild(cell.cellDOM)
        drawChecker(cell)
      }
    }
  }

  function drawChecker (cell) {
    if (cell.y % 2 === cell.x % 2 && (cell.x < TOP_UP || cell.x > BOTTOM_FROM)) {
      const checkerColor = cell.x < TOP_UP ? COLORS.checker.dark : COLORS.checker.light
      const checker = new Checker(checkerColor)
      checker.belongsTo(cell)
      cell.containChecker(checker)
    }
  }

  function updateInfo () {
    self.turnsCountDOM.textContent = self.turnsCount
    self.turnColorDOM.style.backgroundColor = BG_COLORS[ self.currentTurn ]
  }

  // testing functions
  function testCheckers (checkerColor, cells) {
    cells.forEach((cell) => {
      const testChecker = new Checker(checkerColor)
      const testCell = document.getElementById(`cell_${cell.x}_${cell.y}`).obj
      testChecker.belongsTo(testCell)
      testCell.containChecker(testChecker)
    })
  }

  function deleteChecker (x, y) {
    const cell = document.getElementById(`cell_${x}_${y}`).obj
    if (!cell || !cell.checker) return false
    cell.removeChecker()
    return true
  }

// init
  drawBoard()
  updateInfo()
// TEST
  // testCheckers(COLORS.checker.dark, [{x: 5, y: 5}, {x: 5, y: 3}])
  // deleteChecker(6, 4)
  // deleteChecker(6, 6)
// MARK
  gameController.markAvailableCheckers(self.currentTurn)
}

Checkers.init = function () {
  window.checkers = new Checkers()
}

Checkers.init()

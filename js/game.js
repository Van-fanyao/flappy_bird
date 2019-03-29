//实例化game
var game = new Phaser.Game(288, 505, Phaser.AUTO, 'game');
//创建一个对象用来存放要用到的state
game.States = {};

//boot场景，用来做一些游戏启动前的准备
game.States.boot = function () {
    //加载进度条图片资源
    this.preload = function () {
        game.load.image('loading', 'images/progress.gif')
    };
    //加载完成后，调用preload场景
    this.create = function () {
        game.state.start('preload')
    }
}

//preload场景，用来显示资源加载进度
game.States.preload = function () {
    this.preload = function () {
        //创建显示loading进度的sprite
        var preloadSprite = game.add.sprite(50, game.height / 2, 'loading');
        //用setPreloadSprite方法来实现动态进度条的效果
        game.load.setPreloadSprite(preloadSprite);

        //加载游戏资源
        //游戏背景图
        game.load.image('background', 'images/background.png');
        //地面
        game.load.image('ground', 'images/ground.png');
        //游戏标题
        game.load.image('title', 'images/title.png');
        //鸟
        game.load.spritesheet('bird','images/bird.png',34,24,3);
        //game.load.image('bird', 'images/bird.png');
        //按钮
        game.load.image('btn', 'images/btn.png');
        //管道
        game.load.spritesheet('pipe','images/pipes.png',54,320,2); //管道
       // game.load.image('pipe', 'images/pipes.png');
        //显示分数的字体
        game.load.bitmapFont('flappy_font', 'fonts/flappyFont.png', 'fonts/flappyFont.fnt');

        //飞的音效
        game.load.audio('fly_sound', 'images/flap.wav');
        //得分的音效
        game.load.audio('score_sound', 'images/score.wav');
        //撞击管道的音效
        game.load.audio('hit_pipe_sound', 'images/pipe-hit.wav');
        //撞击地面的音效
        game.load.audio('hit_ground_sound', 'images/ouch.wav');

        //开始游戏
        game.load.image('ready_text', 'images/get_ready.png');
        //玩法提示图片
        game.load.image('play_tip', 'images/instructions.png');
        //game over
        game.load.image('game_over', 'images/game_over.png')
        //得分板
        game.load.image('score_board', 'images/scoreboard.png')

    };
    //当以上所有资源都加载完成后就可以进入menu游戏菜单场景了
    this.create = function () {
        game.state.start('menu');
    }
};
//menu场景，游戏菜单
game.States.menu = function () {
    this.create = function () {
        //当作背景的titleSprite
        var bg = game.add.tileSprite(0, 0, game.width, game.height, 'background');
        //当作地面的tileSprite
        var ground = game.add.tileSprite(0, game.height - 112, game.width, 112, 'ground');
        //让背景动起来
        bg.autoScroll(-10, 0);
        //让地面动起来
        ground.autoScroll(-100, 0)

        //创建存放标题的组
        var titleGroup = game.add.group();
        //通过组的create方法创建标题图片并添加到组里
        titleGroup.create(0, 0, 'title');
        //创建bird对象并添加到组里
        var bird = titleGroup.create(190, 10, 'bird');
        //给鸟添加动画
        bird.animations.add('fly');
        //播放动画
        bird.animations.play('fly', 12, true)
        //调整组的水平位置
        titleGroup.x = 35;
        //调整组的垂直位置
        titleGroup.y = 100;
        //对这个组添加一个tween动画，让它不停的上下移动
        game.add.tween(titleGroup).to({y: 120}, 1000, null, true, 0, Number.MAX_VALUE, true);
        //添加一个按钮
        var btn = game.add.button(game.width / 2, game.height / 2, 'btn', function () {
            //点击按钮时跳转到play场景
            game.state.start('play')
        });
        //设置按钮的中心点
        btn.anchor.setTo(0.5, 0.5);
    }

};
//play场景，正式的游戏部分
game.States.play = function () {
    this.create = function () {
        //背景图等游戏开始后再动
        this.bg = game.add.tileSprite(0, 0, game.width, game.height, 'background');
        //创建用于存放管道的组
        this.pipeGroup = game.add.group();
        this.pipeGroup.enableBody = true;
        //地板不动，等待游戏开始后动
        this.ground = game.add.tileSprite(0, game.height - 112, game.width, 112, 'ground');
        //鸟
        this.bird = game.add.sprite(50, 150, 'bird');
        //添加动画
        this.bird.animations.add('fly');
        //播放动画
        this.bird.animations.play('fly', 12, true);
        //设置中心点
        this.bird.anchor.setTo(0.5, 0.5)
        //开启鸟的物理系统
        game.physics.enable(this.bird, Phaser.Physics.ARCADE);
        //未开始游戏前，先将鸟的重力设置为0，不然鸟会掉下来
        this.bird.body.gravity.y = 0;
        //开启地面的物理系统
        game.physics.enable(this.ground, Phaser.Physics.ARCADE);
        //让地面在物理环境中固定不动
        this.ground.body.immovable = true;
        this.soundFly = game.add.sound('fly_sound');
        this.soundScore = game.add.sound('score_sound');
        this.soundHitPipe = game.add.sound('hit_pipe_sound');
        this.soundHitGround = game.add.sound('hit_ground_sound');
        this.scoreText = game.add.bitmapText(game.world.centerX-20, 30, 'flappy_font', '0', 36);
        //开始游戏文字
        this.readyText = game.add.image(game.width / 2, 40, 'ready_text');
        //提示点击屏幕图片
        this.playTip = game.add.image(game.width / 2, 300, 'play_tip');
        this.readyText.anchor.setTo(0.5, 0);
        this.playTip.anchor.setTo(0.5, 0);

        //判断游戏是否已开始
        this.hasStarted = false;
        //利用时钟事件来循环产生管道
        game.time.events.loop(900, this.generatePipes, this);
        //先停止时钟
        game.time.events.stop(false);
        //点击屏幕后正式开始游戏
        game.input.onDown.addOnce(this.startGame, this);

    };
    this.startGame = function () {
        //游戏速度
        this.gameSpeed = 200;
        //游戏是否结束标志
        this.gameIsOver = false;
        //游戏是否已碰撞到地面标志
        this.hasHitGround = false;
        //游戏是否已开始标识
        this.hasStarted = true;
        //初始得分
        this.score = 0;
        //让背景开始移动
        this.bg.autoScroll(-(this.gameSpeed / 10), 0);
        //让地面开始移动
        this.ground.autoScroll(-this.gameSpeed, 0);
        //给鸟设置一个重力
        this.bird.body.gravity.y = 1150;
        //去除游戏开始图片
        this.readyText.destroy();
        //去除玩法提示图片
        this.playTip.destroy();
        //给鼠标按下事件绑定鸟的飞翔动作
        game.input.onDown.add(this.fly, this)
        //启动时钟事件，开始制造管道
        game.time.events.start()


    };
    //制造一组上下移动的管道
    this.generatePipes = function (gap) {
        //上下管道之间的间隙宽度
        gap = gap || 100;
        //计算出一个上下管道之间的间隙随机位置
        var position = (505 - 320 - gap) + Math.floor((505 - 112 - 30 - gap - 505 + 320 + gap) * Math.random());
        //上方管道的位置
        var topPipeY = position - 360;
        //下方管道的位置
        var bottomPipeY = position + gap;
        //如果有出了边界的管道，则重置它们，不再制造新的管道，重复利用
        if (this.resetPipe(topPipeY, bottomPipeY)) return;
        //上方的管道
        var topPipe = game.add.sprite(game.width, topPipeY, 'pipe', 0, this.pipeGroup);
        //下方的管道
        var bottomPipe = game.add.sprite(game.width, bottomPipeY, 'pipe', 1, this.pipeGroup);
        //边界检测
        this.pipeGroup.setAll('checkWorldBounds', true);
        //出边界后自动kill
        this.pipeGroup.setAll('outOfBoundsKill', true);
        //设置管道运动速度
        this.pipeGroup.setAll('body.velocity.x', -this.gameSpeed);

    };

    this.fly = function () {
        //给鸟设一个向上的速度
        this.bird.body.velocity.y = -350;
        //上升时头朝上的动画
        game.add.tween(this.bird).to({angle: -30}, 100, null, true, 0, 0, false);
        //播放飞翔的音效
        this.soundFly.play();
    };
    //重置出了边界的管道，做到回收利用
    this.resetPipe = function (topPipeY, bottomPipeY) {
        var i = 0;
        //对组调用foreachDead方法来获取那些出了边界的对象
        this.pipeGroup.forEachDead(function (pipe) {
            //上方的管道
            if (pipe.y <= 0) {
                //重置到初始位置
                pipe.reset(game.width, topPipeY)
                //重置为未得分
                pipe.hasScored = false;
            } else {
                //下方管道
                //重置到初始位置
                pipe.reset(game.width, bottomPipeY);

            }
            //设置管道速度
            pipe.body.velocity.x = -this.gameSpeed;
            i++;
        }, this);
        return i == 2;
    };
    //碰撞检测
    this.update = function () {
        //游戏没有开始，先不执行任何东西
        if (!this.hasStarted) return;
        //检测与地面的碰撞
        game.physics.arcade.collide(this.bird, this.ground, this.hitGround, null, this);
        //检测与管道的碰撞
        game.physics.arcade.overlap(this.bird, this.pipeGroup, this.hitPipe, null, this);
        //下降时鸟的头朝下的动画
        if (this.bird.angle < 90) {
            this.bird.angle += 2.5;
        }
        //分数的检测和更新
        this.pipeGroup.forEachExists(this.checkScore, this);
    };
    this.hitGround = function () {
        //已经撞击过地面
        if(this.hasHitGround) return;
        this.hasHitGround = true;
        this.soundHitGround.play();
        this.gameOver(true);
    };
    this.hitPipe = function () {
        if(this.gameIsOver) return;
        this.soundHitPipe.play();
        this.gameOver();
    };
    this.gameOver =function (show_text) {
        this.gameIsOver = true;
        this.stopGame();
        if(show_text) this.showGameOverText();
    };
    this.checkScore = function (pipe) {
        //pipe.hasScored 属性用来标识该管道是否已经得过分
        //pipe.y<0是指一组管道中的上面那个管道，一组管道中我们只需要检测一个就行了
        //当管道的x坐标 加上管道的宽度小于鸟的x坐标的时候，就表示已经飞过了管道，可以得分了
        if (!pipe.hasScored && pipe.y <= 0 && pipe.x <= this.bird.x - 17 - 54) {
            //标识已经得过分了
            pipe.hasScored = true;
            //更新分数显示
            this.scoreText.text = ++this.score
            //得分的音效
            this.soundScore.play();
            return true;
        }
        return false;
    };
    this.stopGame = function(){
        this.bg.stopScroll();
        this.ground.stopScroll();
        this.pipeGroup.forEachExists(function(pipe){
            pipe.body.velocity.x = 0;
        }, this);
        this.bird.animations.stop('fly', 0);
        game.input.onDown.remove(this.fly,this);
        game.time.events.stop(true);
    };
    this.showGameOverText = function () {
        this.scoreText.destroy();
        game.bestScore = game.bestScore || 0;
        //最好分数
        if(this.score > game.bestScore) game.bestScore = this.score;
        //添加一个组
        this.gameOverGroup = game.add.group();
        //game over 文字图片
        var gameOverText = this.gameOverGroup.create(game.width/2,0,'game_over');
        //分数板
        var scoreboard = this.gameOverGroup.create(game.width/2,70,'score_board');
        //当前分数
        var currentScoreText = game.add.bitmapText(game.width/2 + 60, 105, 'flappy_font', this.score+'', 20, this.gameOverGroup);
        //最好分数
        var bestScoreText = game.add.bitmapText(game.width/2 + 60, 153, 'flappy_font', game.bestScore+'', 20, this.gameOverGroup);
        //重玩按钮
        var replayBtn = game.add.button(game.width/2, 210, 'btn', function(){
            game.state.start('play');
        }, this, null, null, null, null, this.gameOverGroup);
        gameOverText.anchor.setTo(0.5, 0);
        scoreboard.anchor.setTo(0.5, 0);
        replayBtn.anchor.setTo(0.5, 0);
        this.gameOverGroup.y = 30;
    }


};
//把定义好的场景添加到游戏中
game.state.add('boot', game.States.boot);
game.state.add('preload', game.States.preload);
game.state.add('menu', game.States.menu);
game.state.add('play', game.States.play);

//调用boot场景启动游戏
game.state.start('boot')
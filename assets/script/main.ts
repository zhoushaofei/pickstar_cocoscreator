const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    @property(cc.Node) player:cc.Node = null;
    @property(cc.Node) star:cc.Node = null;
    @property(cc.Label) score_txt:cc.Label = null;
    @property(cc.Animation) score_anim:cc.Animation = null;
    @property(cc.Node) readme:cc.Node = null;
    @property(cc.Node) gameover:cc.Node = null;
    @property(cc.Node) btn_play:cc.Node = null;
    @property(cc.Node) ground:cc.Node = null;
    @property({type:cc.AudioClip}) score_audio:cc.AudioClip = null;
    @property({type:cc.AudioClip}) jump_audio:cc.AudioClip = null;

    private jumpHeight:number = 180;
    private jumpDuration:number = 0.3;
    private squashDuration:number = 0.1;
    private maxMoveSpeed:number = 550;

	private speed_x:number = 0;
	private acc_dir:number = 0;
	private accel:number = 450;
	private score:number = 0;
    private min_duration:number = 2;
    private max_duration:number = 4;

    onLoad() {
        this.player.active = false;
        this.star.active = false;
		this.gameover.active = false;
		this.score_anim.node.active = false;

        this.setScore(0);

        this.btn_play.on('click', this.onStartPlay, this);
    }

    update(dt) {
		// 根据当前加速度方向每帧更新速度
		if (this.acc_dir == -1) {
			this.speed_x -= this.accel * dt;
		} else if (this.acc_dir == 1) {
			this.speed_x += this.accel * dt;
		} else if (this.acc_dir) {
			this.speed_x = 100;
		}

		// 限制主角的速度不能超过最大值
		if ( Math.abs(this.speed_x) > this.maxMoveSpeed ) {
			// if speed reach limit, use max speed with current direction
			this.speed_x = this.maxMoveSpeed * this.speed_x/Math.abs(this.speed_x);
		}

		// 根据当前速度更新主角的位置
		this.player.x += this.speed_x * dt;

		// limit player position inside screen
		if ( this.player.x > this.node.width/2) {
			this.player.x = this.node.width/2;
			this.speed_x = 0;
		} else if (this.player.x < -this.node.width/2) {
			this.player.x = -this.node.width/2;
			this.speed_x = 0;
		}

		// 碰撞检测
		if (this.player.getBoundingBox().contains(this.star.position)) {
			this.onPickStar();
		}
    }

	private onStartPlay():void {
		this.readme.active = false;
		this.gameover.active = false;
		this.btn_play.active = false;
		this.player.active = true;
		this.star.active = true;
		this.enabled = true;

		this.starReinit();
		this.playerStartMove();
        this.setScore(0);

        this.node.on('touchstart', this.onTouchBegin, this);
        this.node.on('touchend', this.onTouchEnd, this);
	}

	private onGameOver():void {
		this.enabled = false;
		this.gameover.active = true;
        this.btn_play.active = true;

        this.player.stopAllActions();
        this.star.stopAllActions();

        this.node.off('touchstart', this.onTouchBegin, this);
        this.node.off('touchend', this.onTouchEnd, this);
	}

	private onPickStar():void {
		cc.audioEngine.playEffect(this.score_audio, false);
		this.score_anim.node.active = true;
		this.score_anim.node.setPosition(this.star.position);
        this.score_anim.play();
		this.setScore(this.score+1);
		this.starReinit();
	}

	private onTouchBegin(ev:cc.Event.EventTouch):void {
        var pos = this.node.convertToNodeSpaceAR(ev.getLocation());
        if (pos.x >= 0) {
            this.acc_dir = 1;
        } else {
            this.acc_dir = -1;
        }
	}

	private onTouchEnd(ev:cc.Event.EventTouch):void {
		this.acc_dir = 0;
	}

	private playerStartMove():void {
		this.acc_dir = 0;
		this.speed_x = 0;
		this.player.x = 0;
		this.player.y = this.ground.y+this.ground.height/2;

        this.player.runAction(cc.sequence(
            cc.scaleTo(this.squashDuration, 1, 0.6), // squash
            cc.scaleTo(this.squashDuration, 1, 1.2), // stretch
            cc.moveBy(this.jumpDuration, cc.v2(0, this.jumpHeight)).easing(cc.easeCubicActionOut()), // jumpUp
            cc.scaleTo(this.squashDuration, 1, 1), // scaleBack
            cc.moveBy(this.jumpDuration, cc.v2(0, -this.jumpHeight)).easing(cc.easeCubicActionIn()), // jumpDown
            cc.callFunc(function(){cc.audioEngine.playEffect(this.jump_audio,false)}, this)
        ).repeatForever());
    }

	private starReinit():void {
        this.star.stopAllActions();
        this.star.opacity = 255;
		this.starSetNewPosition();
        this.star.runAction(cc.sequence(
            cc.fadeOut(this.getStarDuration()),
            cc.callFunc(this.onGameOver, this)
        ));
	}

	private starSetNewPosition():void {
        let rand_x = this.star.x;
        let rand_y = this.ground.y+this.ground.height/2 + Math.random()*this.jumpHeight + 50;
        while (Math.abs(rand_x-this.star.x) < 100) {
            rand_x = (Math.random()-0.5)*this.node.width;
        }
		this.star.x = rand_x;
		this.star.y = rand_y;
	}

    private getStarDuration():number {
        return this.min_duration + Math.random()*(this.max_duration - this.min_duration);
    }

	private setScore(x:number):void {
		this.score = x;
		this.score_txt.string = "Score: " + this.score;
	}
}

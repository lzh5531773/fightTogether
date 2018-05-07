cc.Class({
	extends: cc.Component,

	properties: {
		enemy: cc.Node,
		harmNum: {
			default: null,
			type: cc.Prefab
		},
		kcoin: {
			default: null,
			type: cc.Prefab
		},
		knifeCtr: {
			type: cc.Node,
			default: null
		},
		harmLabel: cc.Label,
		exceedLabel: cc.Label,
		progressBar: cc.Node,
		_attack: 0,
		_HP: 0,
		_harm: 0,
		_harmNumPool: null,
		_kcoinPool: null,
		_kcoinArray: null,
		_initPoolCount: 10,
		_randomRange: 0,
		_attackNum: 0,
		_exceedNum: 0,
		_exceedMap: null,
	},

	onLoad () {
		this.setHarmLabel(this._harmScore)
		// 初始化超过人数表
		this.initExcees()
		this.setExceedLabel()
		//初始化对象池
		this.initPool()
		this._attack = this.getAttack()
		this._HP = this.getHP()
		this._kcoinArray = []
		this._exceedNum = 0
		//金币x坐标随机范围
		this._randomRange = 100
	},

	onEnable () {
		cc.director.getCollisionManager().enabled = true;
	},

	onDisable () {
		cc.director.getCollisionManager().enabled = false;
	},

	onCollisionEnter (other, self) {
		if (self.tag === 1) {
			const hitPosition = other.node.getPosition()
			//敌人受伤状态
			this.enemy.getComponent('game-enemy-script').animate(2)
			//显示伤害值
			this.createHarmNum(this.harmNum)
			//血条减少
			this._HP -= this._attack* .001
			this.setHP(this._HP)
			//造成伤害
			this._harm += this._attack
			this.setHarmLabel(this._harm)
			//显示超越数值
			this.setExceedLabel()
			//氪币掉落
			this.createKcoin(hitPosition)
		}
	},

	//受伤动画结束
	onHarmedAniCompleted () {
		console.log('onHarmedAniCompleted')
		this.enemy.getComponent('game-enemy-script').animate(1)
	},

	initExcees () {
		// 手速+暴击次数
		this._exceedMap = new Map([[.005, 55],[.01, 70],[.015, 80],[.02, 100],[.03, 130],[.04, 150],[.05, 170],[.06, 205], [.07, 245], [.08, 280], [.09, 300]])
		this._attackNum = 100
	},

	initPool () {
		this._harmNumPool = new cc.NodePool()
		this._kcoinPool = new cc.NodePool()
		for (let i = 0; i < this._initPoolCount; ++i) {
			const harmNum = cc.instantiate(this.harmNum),
				kcoin = cc.instantiate(this.kcoin)
			this._harmNumPool.put(harmNum)
			this._kcoinPool.put(kcoin)
		}
	},

	setHarmLabel (num) {
		if(!num) return
		this.harmLabel.string = '造成伤害' + Math.floor(num)
	},

	setExceedLabel () {
		if (this._attackNum <= 0) {
			this.exceedLabel.string = '是本次首战超人!'
			return
		}
		const knife = this.knifeCtr.getChildByName('knife').getComponent('game-knife-script'),
			ss = knife? knife.getScratchSpeed() : 0
		let num = 0,
			percent = 0,
			threshold = this.getThreshold(this._exceedNum/this._attackNum)
		for (let item of this._exceedMap.entries()) {
			if (ss >= item[1]) {
				percent = item[0]
			}
		}
		num = this._attackNum>1? (this._attackNum>=100? Math.floor(this._attackNum* percent):this._attackNum* percent): (percent>.06? 1:0)
		this._exceedNum += num* threshold
		console.log('this._attackNum', this._attackNum)
		console.log('this._exceedNum', this._exceedNum)
		this._exceedNum<=this._attackNum && (this.exceedLabel.string = '已超过' + Math.floor(this._exceedNum) + '名超人')
	},

	createHarmNum (harm) {
		if(!harm) return
		let harmNum = null
		if (this._harmNumPool && this._harmNumPool.size() > 0) {
			harmNum = this._harmNumPool.get()
		} else {
			harmNum = cc.instantiate(harm)
		}
		this.enemy.addChild(harmNum)
		harmNum.setPosition(cc.v2(this.enemy.getPosition()))
		harmNum.setScale(.5, .5)
		const fadeIn = cc.fadeIn(.6).easing(cc.easeCubicActionIn()),
			scale = cc.scaleBy(.8, .8).easing(cc.easeCubicActionOut()),
			moveUp = cc.moveBy(.3, cc.p(0, 150)),
			fadeOut = cc.fadeOut(.6).easing(cc.easeCubicActionOut()),
			sequences = [moveUp, fadeOut]
		harmNum.runAction(cc.sequence(...sequences, cc.callFunc(function() {
			this.destoryHarmNum(harmNum)
		}, this)))
		console.log('in createHarmNum this._harmNumPool', this._harmNumPool)
	},

	destoryHarmNum (harmNum) {
		if(!harmNum) return
		this._harmNumPool.put(cc.instantiate(this.harmNum))
		harmNum.destroy()
	},

	createKcoin (position) {
		if(!position) return
		let kcoin = this._kcoinPool && this._kcoinPool.size() > 0? this._kcoinPool.get() : cc.instantiate(this.kcoin)
		this.knifeCtr.addChild(kcoin)
		kcoin.setPosition(cc.v2(position))
		// const	kcoinAnim = kcoin.getComponent(cc.Animation)
		// kcoinAnim && (kcoinAnim.play('gold'))
		this._kcoinArray.push(kcoin)
		const x = Math.round(Math.random()* this._randomRange)* (Math.random()>0.5? 1:-1)
		this.emitTo(kcoin.getComponent('cc.RigidBody'), {x: x, y: 400})
	},

	destoryKcoin (kcoin) {
		if(!kcoin) return
		this._kcoinPool.put(cc.instantiate(this.kcoin))
		kcoin.destroy()
	},

	getAttack () {
		const attack = 1
		return attack
	},

	getHP () {
		const progressBar = this.progressBar.getComponent('cc.ProgressBar')
		return progressBar.progress
	},

	getThreshold (prop) {
		let threshold = 0
		if (prop < 0.1) threshold = 0.5
		else if (prop < 0.3) threshold = 0.2
		else if (prop < 0.6) threshold = 0.1
		else if (prop < 0.9) threshold = 0.05
		else threshold = 0.01
		return threshold
	},

	setHP (val) {
		const progressBar = this.progressBar.getComponent('cc.ProgressBar')
		progressBar.progress = val
	},

	emitTo (body, target) {
		let x = target.x,
			y = target.y,
			selfX = this.node.x,
			selfY = this.node.y,
			distance = Math.sqrt((x-selfX)*(x-selfX) + (y-selfY)*(y-selfY)),
			velocity = cc.v2(x-selfX, y-selfY)
		velocity.normalizeSelf()
		velocity.mulSelf(distance* 2)
		console.log('emitTo velocity', velocity)
		console.log('emitTo distance', distance)
		body.linearVelocity = velocity
	},

	update (dt) {
		//检测金币是否离开可视范围
		this._kcoinArray.forEach((kcoin) => {
			if(kcoin.getPosition().y < 0) {
				this.destoryKcoin(kcoin)
			}
		})
	}

});

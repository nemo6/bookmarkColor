const fs = require("fs")
const _  = init()

_(process.argv.slice(2)[0])
.read()
.parse()
.mapForObject( (x,i,p,last) => ( i == "name" && (/#\w+/).test(x) ) && { "name":x, "folder": last(p,3).name, "url":last(p,1).url } )
.tap( findReg )
// .filter( x => x.reg.includes("#AE") )
// .tap( regFilter )
.serverEx2()
.valueOf()

//

function serverEx2(obj,n){

	const express = require("express")
	const app     = express()
	const PORT    = 8080

	app.use(express.static(__dirname))

	app.get('/:id',(req, res) => {

		res.writeHead(200,{"content-type":`text/${n};charset=utf8`})

		rq = req.params.id

		let v = _(obj)
		.filter( x => x.reg.includes(`#${rq}`) )
		.tap( regFilter )
		.valueOf()

		res.end(JSON.stringify(v))

	})

	app.listen(PORT)

	console.log(`Running at port ${PORT}`)

}

function regFilter(obj){

	for( let k=0;k<(obj.length-1);k++){

		let d = x => ! ( x.split("").slice(1).every( y => (/\d/).test(y) || x.split("").slice(1).length == 1) )
		let e = x => ! ( x.split("").slice(1).some(  y => y == y.toLowerCase() && !(/\d/).test(y) ) )
		
		obj[k].reg = obj[k].reg.filter( d )
		obj[k].reg = obj[k].reg.filter( e )
	}

	for( let k=0;k<(obj.length-1);k++){

		if( obj[k].reg.length == 0 ){

			obj.splice(k,1);k--
		}
	}

}

function escape(obj){
	for( let k in obj ) if( (/Syntax highlighting/).test(obj[k].name) ) obj[k].name = _.escape(obj[k].name)
}

function findReg(m){

	loop(m)
	.map( (x,m) => m[x].name.match(/#\w+/g) )
	.map( (x) => x == null )
	.map( (x,i,reg,m) => x ? m.splice(i,1) : Object.assign(m[i],{reg}) ).valueOf()

	// loop( m, x => m[x].name.match(/#\w+/g), x=>x==null, (x,i,reg) => x ? m.splice(i,1) : Object.assign(m[i],{reg}) )
}

function loop(m) {

	return {
		m : [m],
		map : function(x) {
			this.m.push(x);return this
		},
        valueOf : function() {
        	this.loop(...this.m)
        },
        loop : function (m,c,d,e,i=0){

			if( i >= m.length )
			return m

			else {
					
				let reg  = c(i,m)
				let bool = d(reg)
				e(bool,i,reg,m)

				if ( bool ){

					this.loop(m,c,d,e,i)

				}else{

					this.loop(m,c,d,e,i+1)
				}
			}
		}
	}
}

function pushReg(x){

	let check = x => x.reduce( (o,v) => ({...o,[v]:(o[v]??0)+1 }),{})
	let m = _.map(x,"reg").flat()
	x.push(check(m))
}

function color(x){
	for( let k in x )
	x[k].name=x[k].name.short(67)
}

function head(x){
	return x.splice(0,x.length-1)
}

function last(x){
	return x.slice(-1)[0] // .at(-1)
}

function typeValue(x){

	if( Array.isArray(x) )
	return "array"
	else if ( typeof x == "object" && x != null )
	return "object"
	else
	return "value"
}

function sort(obj){ // sortObject

	let m = {}
	let items = []
	for ( let k in obj ){
		items.push({"id": k ,"value":obj[k]})
	}
	items.sort( (a,b) => b.value - a.value)
	for( let x of items )
	m[x.id] = x.value
	return m

}

function mapForObject(x,callback,v=[],i=0,p=[]){

	let last = (x,n) => x[(x.length)-n]

	for ( let y of Object.keys(x) ) {

		if ( typeof x[y] != "object" || x[y] == null ){

			( (x) => x && v.push(x) )( callback(x[y],y,p,last) ) // x[y] value y key p table of parent
		
		}else{

			p.push(x[y])
			i++
			mapForObject(x[y],callback,v,i,p)
			i--
			p.pop()
		}
	}
	return v
}

function server(x,n,callback) {

	const http = require("http")
	const PORT = 8080

	http.createServer(function (req, res) {
		
		res.writeHead(200,{"content-type":`text/${n};charset=utf8`})

		res.end(callback(x))
	  
	}).listen(PORT)

	console.log(`Running at port ${PORT}`)

}

function str(x,n) {
	return ( n == "html" ) ? `<pre>${JSON.stringify(x,null,2)}<pre>` : JSON.stringify(x,null,2)
}

function read(x){
	return fs.readFileSync(x,"utf8")
}

function parse(x){
	return JSON.parse(x)
}

function init(){

	String.prototype.short = function(n){ return this.valueOf().length > n ? this.valueOf().slice(0,n) + "..." : this.valueOf() }

	Array.prototype.transform = function(keys){ // foo(
	let content = "<style>table{font-family:arial,sans-serif;border-collapse:collapse;}td,th{border:1px solid #dddddd;text-align:left;padding:8px;white-space:pre}</style>"
	content += "<table>"
	for ( let x of this ){
	  content += "<tr>"
	    for ( let v of keys )
	      if( typeValue(x[v]) == "value" )
	        content += `<td>${x[v]}</td>`
	      else if( typeValue(x[v]) == "array"  ){
	        let reg = ( x => x.map( v => `<td>${v}</td>`).join("") )(x[v])
	        let border = `border-collapse:separate;border-spacing:13px 0;margin-left:-12px;`
	        content += `<td style="border:none"><table style="${border}">${reg}</table></td>`
	      }
	  content += "</tr>"
	}
	content += "</table>"
	return content
	}

	return require("lodash")
	.mixin({read,parse,server,mapForObject,serverEx2})
}
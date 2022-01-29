const fs = require("fs");

var html = fs.readFileSync("./text.txt", "utf-8");

// 去掉注释
html = html.replace(/<!-- .*? -->/g, "");
// 按行切割
var arr = html.match(/(\S).*/g);

console.log(arr);

/**
 * obj:{
 *  _type:
 *  class:
 *  id:
 *  style:
 *  wxif:
 *  wxelse:
 *  wxfor:
 *  wxkey:
 *  bindtap:
 *  bindchange:
 *  value:
 *  range:
 *  bindcolumnchange:
 *  bindtouchstart:
 *  bindtouchmove:
 *  bindtouchend:
 *  animation:
 *  catchtap:
 *  bindblur:
 *  src:
 *  mode:
 *  hidden:
 *  status: 标签是否结束   0：结束标签, 1：新标签, 2：标签当行起止, 3：无标签，仅内容
 * }
 *
 */

var attributeArr = ["class", "id", "style", "bindtap", "catchtap", "src"];
var logicArr = ["wx:if", "wx:else", "wx:key", "wx:for-item", "wx:for-index"];
var status = ["结束标签", "新标签", "标签当行起止", "无标签，仅内容"];
var stack = [];

var tree = [];
for (let i = 0; i < arr.length; i++) {
	tree.push(getLableAttribute(arr[i]));
}
console.log(tree);

// 变成对象数组
function getLableAttribute(str) {
	var obj = {};
	// 取出标签类型
	if (str.match(/<.*>/) == null) {
		obj.status = 3; // 3：无标签，仅内容
		obj.deep = stack.length + 1;
		obj.data = str;
		return obj;
	}

	// 不能分割 如：<text>123</text>456 => 123456    '456'需写在下一行
	let isStart = str.match(/<[^/]+.*>/) != null; // <[^/]+.*> <[^\/]*>
	let isEnd = str.match(/<\/(\S)*>/) != null;

	if (isStart && isEnd) {
		// '<xxx> && </xxx>'	2：标签当行起止
		obj.status = 2;
	} else if (isStart && !isEnd) {
		// '<xxx>'		1：新标签
		obj.status = 1;
	} else if (!isStart && isEnd) {
		// 'abc</xxx>'	0：结束标签
		obj.status = 0;
	}

	switch (obj.status) {
		case 0: {
			// 提取结束标签的类型
			obj._type = str.match(/<\/.*>/)[0].slice(2, -1);

			// 结束标签所在层数
			obj.deep = stack.length;

			// 出栈
			if (stack.pop() != obj._type)
				console.log("error：type:" + obj._type + "缺少");

			break;
		}
		case 1: {
			// 提取标签类型
			obj._type = str.match(/<.*? /)[0].slice(1, -1);

			// 进栈
			stack.push(obj._type);

			// 当前标签所在层数
			obj.deep = stack.length;

			break;
		}
		case 2: {
			// 提取标签类型
			obj._type = str.match(/<.*? /)[0].slice(1, -1);

			// 当前标签所在层数
			obj.deep = stack.length + 1;

			break;
		}
		default:
			break;
	}

	for (let i = 0; i < attributeArr.length; i++) {
		let attribute = attributeArr[i];
		let length = attribute.length + 2;

		// class=".*?"|class='.*?'	单双引号都匹配
		let reg = new RegExp(attribute + `=".*?"|` + attribute + `='.*?'`, "g");

		let res = str.match(reg);
		if (res != null) obj[attribute] = res[0].slice(length, -1);
	}

	for (let i = 0; i < logicArr.length; i++) {
		let logic = logicArr[i];
		let length = logicArr[i].length + 2;

		let reg = new RegExp(logic + `=".*?"|` + logic + `='.*?'`, "g");

		let res = str.match(reg);
		if (res != null) {
			logic = logic.replace(":", "").replace("-", "");
			obj[logic] = res[0].slice(length, -1);
		}
	}

	obj.data = str.replace(/<.*?>/g, "");

	//   console.log(obj);
	return obj;
}

{
	// obj = [
	// 	{
	// 		_type: "view",
	// 		class: "all",
	// 		data: "",
	// 		wxif: "{{islogin}}",
	// 		child:[
	// 			{
	// 				data: "test"
	// 			},
	// 			{
	// 				_type: "view",
	// 				class: "head",
	// 				data:"",
	// 				child:[
	// 					{
	// 						_type: "view",
	// 						style: "height: {{statusBarHeight}}px;",
	// 						data:"",
	// 						child:[]
	// 					}
	// 				]
	// 			}
	// 		]
	// 	}
	// ]
}

var res = []
for(let i = 0; i < tree.length; i++){
	if(tree[i].status == 0) continue;

	tree[i].child = []
	if(tree[i].deep == 1){
		res.push(tree[i])
		continue
	}

	if(tree[i].deep > tree[i-1].deep){
		tree[i-1].child.push(tree[i])
	}
	else{
		findParent(i)
	}
}
// 向上查找，找到第一个deep比自己低的（即父节点）
function findParent(index){
	for(let i = index-1; i >= 0; i--){
		if(tree[i].deep < tree[index].deep){
			tree[i].child.push(tree[index])
			break;
		}
	}
}

console.log(res)

console.log("done...");

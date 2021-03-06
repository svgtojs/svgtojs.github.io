var JSVGConverter = function (drawingCanvas, testingCanvas) {
	this.drawingCanvas = drawingCanvas;
	this.testingCanvas = testingCanvas;
	this.spies = {};
	this.logs = [];
	this.logCall = function (propertyName, type) {
		this.logs.push([
			Date.now(), 
			propertyName, 
			type, 
			Array.from(arguments).slice(2)
		]);
	}
	this.convertLogs = function () {
		var commands = [];
		var methodDictionary = [];
		for (var ii = 0; ii < this.logs.length; ii++) {
			var commandString = "";
			var isGet = this.logs[ii][2] === "set";
			//commandString += "ctx." + this.logs[ii][1] + (isGet ? "" : "(");
			if (isGet) {
				commandString += "ctx." + this.logs[ii][1] + " = '" + this.logs[ii][3][0] + "';";
			} else {
				var index = methodDictionary.indexOf(this.logs[ii][1]);
				if (index === -1) index = methodDictionary.push(this.logs[ii][1]) - 1;
				var funcName = "f" + index.toString();
				commandString += funcName + "(";
				for (var jj = 0; jj < this.logs[ii][3].length; jj++) {
					commandString += this.logs[ii][3][jj].toString() + (jj === (this.logs[ii][3].length - 1) ? "" : ", ");
				}
				commandString += ");";
			}
			commands[ii] = commandString;
		}
		var dictionaryCommands = "var funcNames = " + JSON.stringify(methodDictionary) + ";\n" + 'for (var ii = 0; ii < funcNames.length; ii++) window["f" + ii.toString()] = ctx[funcNames[ii]].bind(ctx);';
		var resArray = ['var ctx = document.getElementById("<your canvas id here>").getContext("2d");\n', dictionaryCommands, '\nctx.save();\n', commands.join("\n"), "\nctx.restore();"];
		var commands = resArray[3];
		commands = commands.replace(/(\d?\.\d{3})\d+/g, "$1");
		commands = commands.replace("6.283", "6.283185307179586");
		commands = commands.replace(/\s/g, "");
		resArray[3] = commands;
		return resArray;
	}
	this.getSize = function () {
		var width = 0;
		var height = 0;
		for (var ii = 0; ii < this.logs.length; ii++) {
			if (this.logs[ii][1] === "clearRect") {
				width = parseInt(this.logs[ii][3][2]);
				height = parseInt(this.logs[ii][3][3]);
				break;
			}
		}
		return [width, height];
	}
	this.currJS = [];
	this.testJS = function () {
		var sanitizedJS = this.currJS.slice(0);
		var dimensions = this.getSize(this.logs);
		var canvasPreview = document.getElementById(this.testingCanvas);
		canvasPreview.setAttribute("width", dimensions[0] + "px");
		canvasPreview.setAttribute("height", dimensions[1] + "px");
		canvasPreview.style.width = dimensions[0] + "px";
		canvasPreview.style.height = dimensions[1] + "px";
		sanitizedJS[0] = 'var ctx = document.getElementById("canvasPreview").getContext("2d");\n'
		sanitizedJS = sanitizedJS.join("");
		eval(sanitizedJS);
	}
	this.convertSVG = function (svgCode, callback) {
		canvg(document.getElementById(this.drawingCanvas), svgCode, {}, this);
		this.currJS = this.convertLogs(this.logs);
		console.log(this.currJS);
		callback(this.currJS);
	}
};

var init = function () {
	window.JSVG = new JSVGConverter("canvgCanvas", "canvasPreview");
	window.UI = new (function (svgConverter) {
		this.svgConverter = svgConverter;
		this.svgCodeInput = document.getElementById("svgCodeInput");
		this.svgPreviewOutput = document.getElementById("svgPreviewOutput");
		this.jsCodeOutput = document.getElementById("jsCodeOutput");
		this.submitSVGCodeInput = function (e) {
			console.log(this.svgCodeInput.innerText);
			this.svgConverter.convertSVG.call(this.svgConverter, this.svgCodeInput.innerText, this.writeJSCodeOutput.bind(this));
		}
		this.writeJSCodeOutput = function (codeOutput) {
			this.jsCodeOutput.innerText = codeOutput.join("");
		}
		this.previewSVGCodeInput = function (e) {
			console.log(this.svgPreviewOutput.innerHTML, this.svgCodeInput.innerText);
			this.svgPreviewOutput.innerHTML = this.svgCodeInput.innerText;
		}
		this.svgUpload = document.getElementById("svgUpload");
		this.svgPreview = document.getElementById("svgPreview");
		this.svgPreview.addEventListener("click", this.previewSVGCodeInput.bind(this));
		this.svgSubmit = document.getElementById("svgSubmit");
		this.svgSubmit.addEventListener("click", this.submitSVGCodeInput.bind(this));
		this.jsDownload = document.getElementById("jsDownload");
		this.jsTest = document.getElementById("jsTest");
		this.jsTest.addEventListener("click", this.svgConverter.testJS.bind(this.svgConverter));
	})(JSVG);
	/*window.JSVG = new JSVGConverter("canvgCanvas", "canvasPreview");
	JSVG.convertSVG('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 26.458333 26.458334"><g transform="translate(0 -270.542)"><circle cx="13.229" cy="283.771" r="13.229" fill="#08a"/><path d="M20.917 277.081c-.545-.06-1.845 1.01-2.61 1.136-1.076.058-2.257.443-3.377.12-1.603-.46-5.832.423-7.384.852-.44.121 1.74-.735 1.306-.678-3.036.394-5.663 1.608-8.852 5.26 0 .333.013.663.037.99.01.145 2.804-1.937 2.921-2.023C5.426 280.909.1 285.412.115 285.52c.024.184.052.368.084.55.015.085 1.67-1.105 3.291-1.577 2.778-.807 6.064-.929 6.203-.976.267-.09 2.241-.287 2.335-.043.05.133-1.233.515-1.872.846-1.01.524-3.983 1.443-5.403 1.994-2.19.85-4.303.894-4.28.978.1.359.213.712.34 1.058 1.244.378 2.462.287 3.744.018.555-.116 1.145.297 1.731.138.139-.038-.335-.092-.645-.244-.2-.098-.203-.376-.115-.404.231-.073 1.084-.195 1.69-.402.74-.253 1.207-.573 1.57-.65.379-.08 1.038.443 1.59.388.192-.02-.236-.131-.51-.267-.234-.115-.252-.352-.128-.378.187-.037.727.565 1.272.934.344.234.82.211.952.123.148-.098-.378-.217-.574-.265-.274-.068-.698-.666-.402-.797.295-.13.075-.844.398-.784.266.05.204-.317-.287-.27-.411.04-1.267.4-1.585.337-.149-.03.94-.99 1.156-1.124.797-.496 5.084-2.208 6.169-.873.712.86 3.79-.902 4.049-1.283.192-.284-2.19.997-2.881.424-.268-.222-3.288-.545-3.57-.768-.833-.66-2.154-.696-2.513-1.35-.402-.736 2.723-.138 2.774-.802.004-.053 1.297.753 2.402.806 1.34.065 2.56-.622 2.869-.728.857-.293 1.83-1.29 1.556-1.165-.349.16-2.344 1.097-2.644.706-.435-.566 1.444-.22.654-1.029-.24-.245 1.865-1.506 1.382-1.56zM5.092 282.52c.477-.038 1.314.292 1.889.262.657-.033 2.417.046 1.45.117a70.65 70.65 0 0 0-3.25.372c-.608.096-2.286.838-2.293.704-.014-.261 1.61-1.236 2.023-1.415a.563.563 0 0 1 .18-.04z" fill="green"/><path d="M23.24 277.357c-.185.173-.893.179-1.337.437-.706.411-1.358 1.081-1.39.966-.117-.417 1.773-1.962 1.304-2.365-.16-.137-.201.358-1.017.357-1.06-.002-2.684.72-2.025.22.448-.341 1.874-.904 2.08-1.313.355-.706.814-.944.737-2.14a13.31 13.31 0 0 1 1.837 1.826c.015.018-.038.383-.147.64-.107.255-.332.613-.32.633.02.038.326-.364.465-.58.14-.218.174-.48.19-.459.141.178.277.36.408.544-.73.939-.273.753-.786 1.234zM14.472 285.95c.84-.123 1.433.391 2.34.442.561.032 1.208-.079 1.74-.104.329-.015.613.002.809.104.243.127-.368.07-.747.128-.217.032-.32.148-.405.23-.078.077-.147.122-.04.156.394.13 2.08-.365 2.826-.207.746.159.944.218 1.406.605.463.388-.633-.285-1.321-.257-.688.027-1.858.505-2.771.468-.914-.038-3.092-1.542-3.134-.866-.02.32.492.667 1.003.857.568.21 1.452.051.926.277-.622.268-1.115-.241-1.719-.14-.603.102-1.098.905-1.917.69-.586-.154.328-.126.891-.43.199-.107.31-.412.348-.505.145-.357.775-.22-.117-.749-1.818-.936-2.905.448-2.522-.141.382-.59 1.782-.486 2.404-.559zM17.76 290.024c-1.305 1.365-4.853 3.533-6.383 3.867-2.026.443-2.185 2.632-3.932 1.78a13.216 13.216 0 0 1-1.555-.892c-.137-.091 1.521-.754 2.76-1.396.821-.426 1.34-.866 1.332-.974-.006-.093-1.198.91-2.821 1.17-1.285.205-2.512.263-2.615.173a13.299 13.299 0 0 1-2.457-2.843c.783-.656 4.546.613 5.642.499 2.279-.239 1.746.366 3.657.357.48-.002 1.155-1.39 2.327-1.747.538-.164.733-.403 1.075-.529.17-.062.378-.139.682-.079.186.037-.068-.005-.519.188-.5.215-1.08.853-.83.759.132-.05.405-.086.636-.188.68-.296 1.513-.848 2.364-.979.462-.07.933.156 1.314.149.233-.023.686-.106.964-.079.234.024.74.413.322.248-.418-.165-1.473.026-1.962.516zM10.354 272.712c-.678.162-1.235.538-1.943.784-.209.073-.44.105-.68.127-.19.018.926-.384.714-.414-.218-.031-.571.203-1.132.31-.814.155-1.923.195-2.512.055 1.686-1.396 3.939-1.885 6.176-2.307.8-.15 1.409-.725 2.252-.725.67 0 1.33.05 1.973.146.096.014-1.124.179-1.97.431-1.117.333-1.945.775-1.821.8.084.017 1.217-.61 2.366-.753 1.205-.15 2.511-.27 2.6-.248.513.125 1.014.28 1.503.464-3.01.56-6.036.974-7.526 1.33z" fill="green"/><path d="M26.458 283.77c0 .33-.012.656-.035.979-.015.202-.784-.359-1.646-.625-.607-.188-1.394-.13-1.416.01-.02.13.956.34 1.522.796.805.65 1.29 1.596 1.248 1.777a13.13 13.13 0 0 1-.863 2.555c-1.197.917-2.799 1.807-3.854 1.61-.14-.025.922-.141 1.923-.819.709-.48 1.337-1.455 1.706-1.93.438-.562-.857-.673-.892-1.137-.074-.99-1.34-2.143-2.66-2.384-1.006-.183-2.21.497-1.967.227.914-1.017 2.512-.617 3.197-1.015.841-.49 2.745-.195 3.737-.043zM15.068 273.169c-.466.324-.944.865-1.644 1.053-1.742.467-4.896-.24-6.642.468-.191.077-.667.163-1.056.365-.361.187-.578.113-.736.208-.13.08.242.17.682.045.44-.125-.311.704-.504.853-.245.194-.28.551-.526.792-.339.33-.836.506-1.181.834-.555.525-.926 1.18-1.193 1.533-.322.427.827-.482 1.518-1.195.368-.38.859-.38 1.154-.613.575-.45 2.298-.025 3.342-.043.25-.004.46-.102.553-.19.053-.05-.26.012-.43.022-.088.005-.495-.12-.014-.143.481-.022.87-1.453 1.805-1.533.936-.08 3.702 2.4 4.444 1.216.742-1.185 4.943-1.435 4.256-2.058-.057-.051-.34.287-.521.244-.204-.049-.316-.477-.577-.467-.467.018-.875.342-1.15.495-.15.083-.895.278-.992.225-.08-.045.355-.179.484-.24.134-.063.312-.168.259-.298-.2-.487-1.093-.677-.78-1.23.223-.392.69-.542 1.05-.61.234-.044.925.151.414-.174-.606-.385-1.71.23-2.015.44zM23.2 292.465a13.31 13.31 0 0 1-.7.743c-.111.11-1.584.524-1.929.513-.345-.011-2.143.039-2.4.362a.995.995 0 0 1-.733.319c-.433-.01-1.02-.126-.875-.046.082.045.196.278.472.307.345.036.946.251 1.245.057.72-.466 1.722-.64 1.995-.607.592.07 1.031.136.961.19-.398.303-.814.584-1.246.841-.492.294-.62.056-1.784.536-1.435.593-1.173.789-1.924.966-.98.232-2.002.354-3.053.354-.085 0 .124-.323.692-.489.795-.232 2.003-.26 1.92-.335-.08-.072-1.004-.086-1.955.119-.861.185-1.785.658-1.881.65a13.167 13.167 0 0 1-2.8-.568c6.214-.253 4.356-1.622 4.78-2.036.587-.573 3.249-2.147 3.921-1.91.125.044-.38.155-.68.38-.24.18-.406.304-.345.29.794-.19 2.199-.84 2.538-.77.34.069 1.202-.669.889-.141-.313.528 1.702-.367 2.893.275zM25.567 280.394c-.898-.932-1.22.47-2.055.82-.13.054.137-.427-.162-.554-.4-.17-1.15-.171-1.749.148-.308.165-.614 1-.647.437-.052-.877 1.05-.91 1.761-.96.804-.057.723-2.058 2.506-2.1.09.167.194.365.293.619a10.484 10.484 0 0 1 .235.662c.06.188.122.399.186.621 0 .279-.036.466-.123.607-.395.643-.158.054-.14-.141.017-.178-.03-.279-.105-.16z" fill="green"/></g></svg>');*/
}
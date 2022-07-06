// var require = {
//   paths: {
//     'vs': '/static/resource/monaco/min/vs'
//   }
// };

// window.MonacoEnvironment = { getWorkerUrl: () => proxy };

// let proxy = URL.createObjectURL(new Blob([`
// 	self.MonacoEnvironment = {
// 		baseUrl: '/static/resource/monaco/min/'
// 	};
// 	importScripts('/static/resource/monaco/min/vs/base/worker/workerMain.js');
// `], { type: 'text/javascript' }));
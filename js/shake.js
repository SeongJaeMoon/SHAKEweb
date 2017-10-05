;
var GLOBALVARS = {
	"plugin_name": "shake.js",
	"version": 1.0,
	"finish": false,
	"all_ifbds": [],
}

var Infoboard = {
	init: function (container, data, isshowbusinfo) {
		var _targettimecatcher = function (i) {
			var str;
			var property = me.data.timetable[me.tableindex].schedule[i].property;
			if (property == 'online') //업그레이드 용
				str = undefined;
				str = me.data.timetable[me.tableindex].schedule[i].time
				str = (new Date).Format('yyyy/MM/dd') + ' ' + str;
				var targettime = new Date(str);
				if (property == 'accurate')
					return [targettime, targettime, 0];
		}
		var _timeshower = function(begin_index) {
			var currenttime = new Date();
			for (var i = begin_index; i < me.data.timetable[me.tableindex].schedule.length; ++i) {
				var currenttime = new Date();
				var tmp = _targettimecatcher(i);
				var targettime = tmp[0];
				var targettime_withdelay = tmp[1];
				var estimate_delay = tmp[2];
				if (currenttime.getTime() < targettime_withdelay.getTime()) {
					var countdown = new Date();
					countdown.setTime(targettime.getTime() - currenttime.getTime());
					if (currenttime.getTime() > targettime.getTime())
						return [i, '도착예정', '예상:'+targettime_withdelay.Format('hh:mm')+'도착', estimate_delay, 10000]; //[currententry index, countdown, nexttime, estimate-delay in min, countdown in min]
					else         //  ↑targettime.Format_('mm:ss')+'처음'                                        ↑ not show is better...? cuz it's just an estimate..
						return [i, countdown, targettime.Format('hh:mm'), estimate_delay, countdown.getTime()/60/1000];
				}
			}
			return [i, '운행 종료', '운행 종료', undefined, undefined];
		}
		//*
		var _stringformatter = function (str) { // return [string to show, extrafield for currententry index, minutes left for the accurate next bus]
			var extrafield = undefined; // prepared for _countdown and _nexttime, transfer current index
			var minutesleft = undefined;
			var pattern0 = /\{(.+?)\}/g;
			var pattern1 = /\[(.+?)\]/g;
			var v = str.match(pattern0); // {route[1]}
			for (var i = v.length - 1; i >= 0; i--) {
				var text;
				var vname = v[i].replace('{','').replace('}',''); // {route[1]}=>route[1]
				var index = vname.match(pattern1)// [1]=>1
				if (index != null)
					index = index[0].replace('[','').replace(']','');
				else
					index = '';
				vname = vname.replace(pattern1, ''); // route[1]=>route
				var predefined = ['_countdown', '_nexttime'];
				if (vname[0] == '_') { //미리 정의 된 값
					if (index == '')
						index = 'auto';
					var result = _timeshower(me.currententry); // 다음 시간 또는 카운트 다운 표시 선택
					text = result[predefined.indexOf(vname)+1];
					extrafield = result[0];
					minutesleft = result[4];
					if (predefined == 1) minutesleft = 1000; // 다음 번에 있으면 진행률 표시하지 않음
					if (typeof text != 'string') // if not "Coming soon", 포멧 지정
						text = text.Format_(index);
					return [text, extrafield, minutesleft];
				}
				if (me.data.timetable[me.tableindex].hasOwnProperty(vname)) {
					if (index != '')
						text = me.data.timetable[me.tableindex][vname][index].toString();
					else
						text = me.data.timetable[me.tableindex][vname].toString();
				} else if (me.data.hasOwnProperty(vname)) {
						if (index != '')
							text = me.data[vname][index].toString();
						else
							text = me.data[vname].toString();
				} else {
					text = v;
				}
				// console.log(vname+' '+index+' '+v[i]+' '+text);
				str = str.replace(v[i], text);
			}
			return [str, extrafield, minutesleft];
		};//*
		var _tableselector = function () {
			var timetable = [];
			$.extend(timetable, me.data.timetable);	// 배열 복사
			for (var i = timetable.length - 1; i >= 0; i--)
				timetable[i]['_id'] = i;
			timetable.sort(function (a, b) {return b.priority - a.priority;}); // priority 기준으로 정렬, stable, the higher the prior
			for (var i = 0; i <= timetable.length - 1; i++) {
				var f = timetable[i].filter[0];
				if (f(timetable[i].filter[1]))
					return timetable[i]._id; // return 원래 색인
			}
			return -1;
		}
		var me = {};
		me.container = container; // div box
		me.expand = false;
		me.data = eval(data); // JSON으로 변환
		me.tag = '_' + container.attr('id');
		if (me.data['version'] > GLOBALVARS['version']){
			console.log('*** New version of shake.js is needed. ***')
			return undefined;
		}

		me.data = preprocess(me.data); // JSON을 표준 JSON으로 변환
		me.tableindex = _tableselector(); // 오늘의 시간표 색인
		me.instant_buffer = []; // 버퍼
		me.daily_buffer = [];
		me.currententry = _timeshower(0)[0]; // 강조용 색인
		me.update = function (mode) {
			if (mode == 1) {
				me.container.children('div.Top-container').children('div.Progress-indicator').removeClass('warning-indicator');
				me.container.children('div.Top-container').children('div.Progress-indicator').removeClass('notice-indicator');
				for (var i = me.instant_buffer.length - 1; i >= 0; i--) {
					var result = _stringformatter(me.instant_buffer.eq(i).attr('formatter'));
					me.instant_buffer.eq(i).text(result[0]);
					if (result[2] != undefined) {
						me.container.children('div.Top-container').children('div.Progress-indicator').attr('tag', result[3]);
						if (result[2] < 2) {
							me.container.children('div.Top-container').children('div.Progress-indicator').addClass('warning-indicator');
						} else if (result[2] < 10) {
							me.container.children('div.Top-container').children('div.Progress-indicator').addClass('notice-indicator'); }
					}
					if (result[1] != undefined) {
						if (me.currententry != result[1]) { // 클래스 업데이트 강조
							me.container.find('div#tabview'+me.tableindex+me.tag).find('div#i'+me.currententry).removeClass('highlight');
							me.container.find('div#tabview'+me.tableindex+me.tag).find('div#i'+me.currententry).addClass('lowlight');
							me.container.find('div#tabview'+me.tableindex+me.tag).find('div#i'+result[1]).addClass('highlight');
						}
						me.currententry = result[1];
					}
				}
			} else if (mode == 0) {
				for (var i = me.daily_buffer.length - 1; i >= 0; i--) {
					var result = _stringformatter(me.daily_buffer.eq(i).attr('formatter'));
					me.daily_buffer.eq(i).text(result[0]);
				}
				me.container.children('div.Top-container').children('div.Progress-indicator').removeClass('warning-indicator');
				me.container.children('div.Top-container').children('div.Progress-indicator').removeClass('notice-indicator');
				me.container.find().removeClass('highlight');
				me.container.find().removeClass('lowlight');
				me.container.find().removeClass('bolder');
				me.tableindex = _tableselector();
				me.currententry = _timeshower(0)[0];
				if (me.tableindex == -1)
					me.container.children('div.Bottom-container').find('a[href="#businfo'+me.tag+'"]').trigger('click').addClass('text-bold');
				else
					me.container.children('div.Bottom-container').find('a[href="#tabview'+me.tableindex+me.tag+'"]').trigger('click').addClass('text-bold');

				for (var i = 0; i < me.currententry; i++) {
					me.container.find('div#tabview'+me.tableindex+me.tag).find('div#i'+i).addClass('lowlight');
				}
				me.container.find('div#tabview'+me.tableindex+me.tag).find('div#i'+me.currententry).addClass('highlight');
				var now = new Date();
				window.setTimeout(function(){global_update(0)},(86400 - (now.getHours()*3600+now.getMinutes()*60+now.getSeconds()))*1000);
			}
		}

		// 정적 컨텐츠 채우기
		me.instant_buffer = me.container.children('div.Top-container').children('div[formatter*="{_"]'); // formatter contains '{_'
		me.daily_buffer = me.container.children('div.Top-container').children().not('div[formatter*="{_"]');

		var tablist = $('<ul class="nav nav-tabs" role="tablist"></ul>');
		var tabcontent = $('<div class="tab-content"></div>');
		for (var i = 0; i < me.data.timetable.length; i++) {
			var tabhref = 'tabview' + i;
			var tabname = me.data.timetable[i].title;
			var tab = $('<li role="presentation"><a href="#'+tabhref+me.tag+'" aria-controls="'+tabhref+me.tag+'" role="tab" data-toggle="tab">'+tabname+'</a></li>');
			tablist.append(tab);

			var tabpanel = $('<div role="tabpanel" class="tab-pane"></div>').attr('id', tabhref+me.tag);
			var whiteshadowbox = $('<div class="box-inner-shadow"></div>');
			var entriescontainer = $('<div class="Entries-container"></div>');
			for (var j = 0; j < me.data.timetable[i].schedule.length; j++) {
				var entry = $('<div class="Entry"></div>').attr('id', 'i'+j);
					var entrycenter = $('<div class="Entry-center"></div>');
				var entrytime = $('<div class="Entry-time"></div>');
				entrytime.text(me.data.timetable[i].schedule[j].time);
				entrycenter.append(entrytime);
				if (me.data.timetable[i].schedule[j].text != undefined){
					var entrytext = $('<div class="Entry-text"></div>');
					entrytext.text(me.data.timetable[i].schedule[j].text);
					entrycenter.append(entrytext);
				}
				entry.append(entrycenter);
				entriescontainer.append(entry);
			}
			// tabpanel.append(whiteshadowbox);
			tabpanel.append(entriescontainer);
			tabcontent.append(tabpanel);
		}
		if (isshowbusinfo) {
			var tab = $('<li role="presentation"><a href="#businfo'+me.tag+'" aria-controls="businfo'+me.tag+'" role="tab" data-toggle="tab">'+"셔틀 정보"+'</a></li>');
			var tabpanel = $('<div role="tabpanel" class="tab-pane"></div>').attr('id', 'businfo'+me.tag);
			var entriescontainer = $('<div class="Entries-container"></div>');
			var listgroup = $('<ul class="list-group padding"></ul>');

			listgroup.append($('<li class="list-group-item"></li>').text("카테고리：" + me.data.name));
			listgroup.append($('<li class="list-group-item"></li>').text("경로：" + me.data.route.join(" => ")));
			listgroup.append($('<li class="list-group-item"></li>').text("최종 업데이트 시간：" + me.data.lastupdate));

			entriescontainer.append(listgroup)
			tablist.prepend(tab);
			tabpanel.append(entriescontainer);
			tabcontent.prepend(tabpanel);

		}
		me.container.children('div.Bottom-container').append(tablist).append(tabcontent);

		me.update(0);
		me.update(1);
		GLOBALVARS['all_ifbds'].push(me);
		return me;
	}
}

function preprocess(json) {
	for (var t = json.timetable.length - 1; t >= 0; t--) { // use 'in' ?
		for (var s = json.timetable[t].schedule.length - 1; s >= 0; s--) {
			if (typeof json.timetable[t].schedule[s] == 'string') { // 간단한 문자열 형식을 JSON으로 변환
				var p = {
					'time': json.timetable[t].schedule[s],
					'property': 'accurate',
				};
				json.timetable[t].schedule[s] = p;
			}
			if (json.timetable[t].schedule[s].hasOwnProperty('text')) { // abbr 인덱스를 실제 텍스트로 변환
				if (typeof json.timetable[t].schedule[s].text == 'number')
					json.timetable[t].schedule[s].text = json.timetable[t].text[json.timetable[t].schedule[s].text];
			} else {
				json.timetable[t].schedule[s].text = undefined;
			}
		}
		json.timetable[t].filter = _datefilter(json.timetable[t].filter); // abbr을 미리 정의 된 함수로 변환
	}
	return json;
}

function _datefilter(filter) {// 경우의 수 필터링  0(토) to 6(일)
	var is_work_day = function () { // 0 - workday, 1 - weekend
		var	this_date = new Date();
		/*if (this_date.getDay()==5)
		  return 1;*/
		if(this_date.getDay()==5)
		  return 1;
		else if (this_date.getDay()==6||this_date.getDay()==0)
			return 1;
		else
		  return 0;
	}
	var _weekdayfilter = function () { // filter = "weekday"
		return is_work_day() == 0;
	};
	var _weekendfilter = function () { // filter = "weekend"
		return !_weekdayfilter();
	};
	//var _dayofFri = function(){
	//	return !_weekdayfilter();
	//};
	var _mixedfilter = function (list) { // filter = ["weekday", "fri", "mon"...]
		var temp = false;
		for (var i = list.length - 1; i >= 0; i--) {
			if (list[i] == 'weekday')
				temp = _weekdayfilter();
			else if (list[i] == 'fri')
				temp = _weekendfilter();
			else if (list[i] == 'weekend')
				temp = _weekendfilter();
			else if (typeof list[i] == 'function')
				temp = list[i]();
			if (temp)
				return true;
		}
		return false;
	}
	if (typeof filter == 'function') //true or false return.
		return [filter, undefined];
	else if (typeof filter == 'boolean')
		return [function(ret){return ret}, filter];
	else if (filter == 'weekday')
		return [_weekdayfilter, undefined];
	else if (filter == 'weekend'||filter == 'fri')
		return [_weekendfilter, undefined];
	//else if (filter == 'fri')
	//	return [_dayofFri, undefined];
	else
		return [_mixedfilter, filter];
};

function global_update(mode) {
	for (var i = GLOBALVARS['all_ifbds'].length - 1; i >= 0; i--) {
		GLOBALVARS['all_ifbds'][i].update(mode);
	}
}

var now = new Date();

var id = window.setInterval(function(){global_update(1)},1000);
var id2 = window.setTimeout(function(){global_update(0)},(86400000 - (now.getHours()*3600+now.getMinutes()*60+now.getSeconds())*1000));

//JAVASCRIPT IN HTML
// $(document).ready(function(){
// 	var containers = $('.Infoboard'); // elements id = Infoboard
// 	var ifbds = new Array(containers.length);
// 	for (var i = containers.length - 1; i >= 0; i--) {
// 		ifbds[i] = Infoboard.init(containers[i], )

// 	}
// });
//http://www.ruanyifeng.com/blog/2012/07/three_ways_to_define_a_javascript_class.html


// 오른쪽 Date각 데이터 타입 지정된 형식으로 변환 String
// 달(M)、일(d)、시간(h)、분(m)、초(s)、분기 별(q) 사용가능 1-2 자리표시，
// 년(y)사용가능 1-4 자리표시，밀리초(S)사용가능 1 자리표시(예: 1-3 비트 수)
// 예：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.Format_ = function(fmt)
{ //author: 인증
	if (fmt == '---:--')
		return (this.getUTCHours()*60+this.getUTCMinutes())+':'+this.Format_('ss');
	else if (fmt == 'auto')
		return ((this.getUTCHours()==0)?(''):(this.getUTCHours()+':'))+this.Format_('mm:ss');
  var o = {
    "M+" : this.getUTCMonth()+1,                 //달
    "d+" : this.getUTCDate(),                    //일
    "h+" : this.getUTCHours(),                   //시간
    "m+" : this.getUTCMinutes(),                 //분
    "s+" : this.getUTCSeconds(),                 //초
    "q+" : Math.floor((this.getUTCMonth()+3)/3), //분기 별
    "S"  : this.getUTCMilliseconds()             //밀리초
  };
  if(/(y+)/.test(fmt))
    fmt=fmt.replace(RegExp.$1, (this.getUTCFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)
    if(new RegExp("("+ k +")").test(fmt))
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
  return fmt;
};
Date.prototype.Format = function(fmt)
{ //author: 인증
  var o = {
    "M+" : this.getMonth()+1,                 //달
    "d+" : this.getDate(),                    //일
    "h+" : this.getHours(),                   //시간
    "m+" : this.getMinutes(),                 //분
    "s+" : this.getSeconds(),                 //초
    "q+" : Math.floor((this.getMonth()+3)/3), //분기 별
    "S"  : this.getMilliseconds()             //밀리초
  };
  if(/(y+)/.test(fmt))
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)
    if(new RegExp("("+ k +")").test(fmt))
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
	return fmt;
};

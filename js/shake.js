var GLOBALVARS = {
  'plugin_name':"shake.js",
  "version":1.0,
  "finish":false,
  "all_ifbds":[],
}
//main 정보 창
var Infoboard = {
  init: function(container, data, isshowbusinfo){
    var_targettimecatcher = function(i){
      var str;
      var property = me.data.timetable[me.tableindex].schedule[i].property;
      if (property=='online') {
        str = undefined;
        str = me.data.timetable[me.tableindex].schedule[i].time
        str = (new Date).Format('yyy/MM/dd')+' '+str;
        var targettime = new Date(str);
        if (property=='accurate') {
          return [targettime, targettime, 0];
          else if (property=='estimate') {
            var estimate_delay = 0;
            if (me.data.timetable[me.tableindex].schedule[i].hasOwnProperty('estimate-delay')) {
              estimate_delay = me.data.timetable[me.tableindex].schedule[i]['estimate-delay'];
              else {
                estimate_delay = me.data.timetable[me.tableindex]['estimate-delay'];
                var targettime_withdelay = new Date();
                targettime_withdelay.setTime(targettime.getTime()+60*1000*estimate_delay);
                return [targettime, targettime_withdelay, estimate_delay];
              }
            }
            var _timeshower = function(begin_index) {
              var currenttime = new Date();
              for (var i = 0; i < me.data.timetable[me.tableindex].schedule.length; ++i) {
        				var currenttime = new Date();
                var tmp = _targettimecatcher(i);
        				var targettime = tmp[0];
        				var targettime_withdelay = tmp[1];
        				var estimate_delay = tmp[2];
        				if (currenttime.getTime() < targettime_withdelay.getTime()) {
        					var countdown = new Date();
        					countdown.setTime(targettime.getTime() - currenttime.getTime());
        					if (currenttime.getTime() > targettime.getTime()){
        						return [i, '오는 중', '예상시간:'+targettime_withdelay.Format('hh:mm')+'도착', estimate_delay, 10000]; //[currententry index, countdown, nexttime, estimate-delay in min, countdown in min]
                  }
                  else{         //  ↑targettime.Format_('mm:ss')+'처음시간'                                        ↑ not show is better...? cuz it's just an estimate..
        						return [i, countdown, targettime.Format('hh:mm'), estimate_delay, countdown.getTime()/60/1000];
                  }
                }
              }
              return [i, '중단', '정전', undefined, undefined];
            }
            var _stringformatter = function(str){
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
        				if (vname[0] == '_') { //predefined
        					if (index == '')
        						index = 'auto';
        					var result = _timeshower(me.currententry); // choose to show nexttime or countdown
        					text = result[predefined.indexOf(vname)+1];
        					extrafield = result[0];
        					minutesleft = result[4];
        					if (predefined == 1) minutesleft = 1000; // if is nexttime, don't show progress indicator
        					if (typeof text != 'string') // if not "Coming soon", do format
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
              $.extend(timetable, me.data.timetable);
              for (var i = timetable.length-1; i >= 0 ; i++) {
                timetable[i]['_id'] = i;
                timetable.sort(function(a,b){return b.priority - a.priority});
                for (var i = 0; i < timetable.length; i++) {
                  var f = timetable[i].filter[0];
                  if (f(timetable[i].filter[1])) {
                    return timetable[i]._id;
                  }
                }
                return -1;
              }
              var me = {};
              me.container = container // div box * Main 화면 구성 container
              me.expand = false;
              me.tag = '_'+container.attr('id'); // JSON 으로 변환
              me.data = eval(data);
              if (me.data['version']>GLOBALVARS['version']) {
                console.log('New version of shake.js is needed');
                return undefined;
              }
              me.data = preprocess(me.data); // abbr JSON 일반 JSON으로 변경
              me.tableindex = _tableselector();
              me.instant_buffer = [];
              me.dailty_buffer = [];
              me.currententry = _timeshower(0)[0];
              me.update = function (mode) {
                if(mode == 1){
                  me.container.children('div.Top-container').children('div.Progress-indicator').removeClass('warning-indicator');
                  me.container.
                }
              }
            }
          }
        }
      }
    }
  }
}

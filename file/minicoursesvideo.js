/**
 * 微课
 * （视频）url = "../test/minicoursesvideo.html?taskid=-4325560902788&courseid=-4288599612431&resid=486430";
 * （回显）url = "../test/completeminicourse.html?taskId=-9144886138141&paperId=-5981172626821&courseId=111&resId=44444';
 *  （做题）url = "../test/minicourses.html?taskId=-4325560902788&paperId=-8652583638814&userType=0&userTypeId=-1330189&from=1&classId=1330189";
 */
//图片上传的初始化文件

$(function () {
    $.getMenu({
        name: '微课程',
        isIndex: false,
        hasRight: false,
        isChat: false
    });

    UE.getEditor('editor', {
        zIndex: 2000,
        wordCount: false,
        toolbars: [['emotion']],
        initialFrameHeight: 100,
        autoHeightEnabled: false
    });

    /*layui.use(['layer'], function () {
        layui.layer.msg('', {offset: '-80px'});
    });*/
    MiniCourse.UploadImg();
    MiniCourse.UploadAddImg();
    //增加浏览量
    MiniCourse.Viewed();

	$('body').on('click', function (e) {
		e = window.event || e;
		var obj = $(e.srcElement || e.target);
		if( obj.attr("id") != "sourceText" ){
			if (!$("#sourceList").hasClass('displayNone')) {
				$("#sourceList").addClass('displayNone');
			}
		}
	});

});
var uploader=null;
var uploader_add=null;
//页面
var pagesize = 10;
//大数据采集的定时器
var Timer = null;
//断点续播的定时器
var videoTimer = null;
//视频
var video_player = null;
// 视频看过的部分
var hadCompleteTime = 0;
//视频是否是看过的
var IS_COMPLETE_VIDEO = false;
var TASKSTATUS=null;
//任务结束的状态值
var TASK_END_STATUS=3;

//校内资源路径
var xnLine = [7,8];
//上传图片报错
var errorTipArr = [];
//追答上传图片报错
var adderrorTipArr = [];

var MiniCourse = {
    //初始化
    Init: function () {
		var _token = $.getToken();
		$.ajax({
			url: BASE_API_URL + '/api-service-course/tpres/cdn-url?r=' + Math.random(),
			data: {},
			type: 'GET',
			dataType: 'JSON',
			beforeSend: function (request) {
				request.setRequestHeader('Authorization', _token);
			},
			success: function (ip) {
				localStorage.setItem('localIp', ip.data.localIp);
				localStorage.setItem('schoolLocalIp', ip.data.schoolLovalIp);

				//资源信息
				MiniCourse.GetSourceInfo();
				//提交学习心得
				MiniCourse.SubList();
				//收藏/取消收藏
				MiniCourse.Collection();
				//获取下载链接
				MiniCourse.GetDownLoad();
				//判断资源是否已收藏
				MiniCourse.GetCollectionStatus();
				MiniCourse.ClearFallout();

				//查询学生是否看完微课任务视频
				MiniCourse.isCompleteVideo();
				MiniCourse.goToMiniCoursesTest();
				//获得大数据相关采集的数据
				MiniCourse.getDataSign();
				//去往测试页面的参数获取
				MiniCourse.minicoursesOtherParams();

				$('.GetBack').click(function () {
					$.goBackCloseWindow();
				});
				$("#firstAddStudyNote").off("keyup").on("keyup", function () {
					$("#firstAddStudyNote").parent().find(".test-textarea-num").text($(this).val().length + "/2000")
				})
				// $.goBackStuListIndex('.GetBack')

				//解决pc端按照名称跳转问题
				if( window.name ){
					window.name = "";
				}
			}
		});

    },
    //资源信息
    GetSourceInfo: function () {
        var _token = $.getToken();
        var _resid = $.getRequest('resid');
        // 请求资源详细信息
        $.ajax({
            url: BASE_API_URL + '/api-service-course/tpres/resource/infos?r=' + Math.random(),
            data: {
                resId: _resid
            },
            type: 'GET',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
                if (res || res.data) {
                    $('#fileName').val(res.data.resName);
                    res.data.resName && $('.TitleRow .Titlename').html('微课程 学习 ' + res.data.resName + ' 并完成试卷');
                    if (res.data.resSource > 1) {
                        // var html = '<a href="http://www.yangcong345.com?q=szwx" target="_blank">' +
                        //     '<img src="../images/pic16_150720.png"></a>' +
                        //     '<img src="../images/Group%2011@2x.png" class="close">';
                        // $('.SourceBox.Ad').append(html).show();
                        // //关闭广告栏
                        // $(".SourceBox.Ad .close").off("click").on("click", function () {
                        //     $(".SourceBox.Ad").remove();
                        // });
                        // $('.Publisher').html('洋葱数学');
                    } else if (res.data.resSource < 2 && res.data.userName) {
                        $('.Publisher').html(res.data.userName);
                    }
                    if(res.data.ncFlag == 1){
                        $('.PubBox').hide()
                    }
                    // if (res.data.cTimeStr && res.data.cTimeStr.length) {
                    //     $('.PubTime').html(res.data.cTimeStr);
                    // }
                    if (res.data.resIntroduce && res.data.resIntroduce.length > 0) {
                        $('.SynopsisBox').show().html('<span>简介：</span><span class="Synopsis">' + res.data.resIntroduce.toLowerCase() + '</span>')
                    }
                    if (parseInt(res.data.ncFlag) === 1) {
                        $('.SourceBox .view').remove();
                        //$('.SourceBox .download').remove();
                        $('.SourceBox .collection').remove();
						$('.DownloadNum').html('(' + res.data.downloadnum + ')');
                    } else {
                        $('.ViewNum').html('(' + res.data.clicks + ')');
                        $('.DownloadNum').html('(' + res.data.downloadnum + ')');
                        $('.CollectionNum').html('(' + res.data.storenum + ')');
                    }
                    var type = 'other';
                    var suffix = res.data.fileSuffixname.toLowerCase();
                    if (res.data.fileSuffixname === null) {
                        type = null;
                    }
                    if (/(.rmvb|.avi|.mov|.flv|.mpg|.vob|.asf|.rm|.tp|.divx|.mpeg|.mpe|.wmv|.mp4|.mkv)$/.test(suffix)) {
                        type = 'video';
                    }

                    //获取任务描述
                    MiniCourse.GetDescription(type, res.data);
                }
            },
            error: function (e) {
                $('.ViewNum').html('(0)');
                $('.DownloadNum').html('(0)');
                $('.CollectionNum').html('(0)');
                layui.use(['layer'], function () {
                    layui.layer.msg('获取资源失败');
                })
            }
        });
    },
    //获取任务描述
    GetDescription: function (type, infos) {
        var _token = $.getToken();
        var courseId=$.getRequest('courseid');
        var taskId=$.getRequest('taskid');
        var resId= $.getRequest('resid');
        $.ajax({
            url: BASE_API_URL + '/api-service-course/tpres/resource-detail?r=' + Math.random(),
            data: {
                courseId:courseId,
                taskId: taskId,
                resId: resId
            },
            type: 'GET',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
                if (res && res.data) {
                    if ( res.data.taskObj&&res.data.taskObj.taskRemark && res.data.taskObj.taskRemark.length > 0) {
                        $('.DescriptionBox').removeClass('hidden');
                        $('.Description').html(res.data.taskObj.taskRemark);
                    }

                    if (res.data.taskObj && res.data.taskObj.remoteType) {
                        if (res.data.taskObj.remoteType === 1) {
                            type = 'video';
                        }
                        if (res.data.taskObj.remoteType === 2) {
                            type = 'zsdx';
                        }
                    }

                    if (type=='video'){
                        // /音/视频控制
						if (parseInt(infos.ncFlag) === 1) {
							MiniCourse.Video('local');
						} else {
							MiniCourse.Video();
						}
                        $('#VideoPlayer .TitleBox .Vtitle').html(infos.resName);
                        $('#VideoPlayer .TitleBox .Vtime span').html(infos.mp4Time + '分钟');

						//标准视频不能下载
                        if(parseInt(resId)<=0){
                            $('.SourceBox .download').show()
                        }
						$('.SourceBox.Video').removeClass('hidden');
                    };

					TASKSTATUS = res.data.taskStatus || 0;
					if (TASKSTATUS === '3') {
						$('.PrimaryDiscuss .UploadBox').remove();
						$('.IconBox .AppendBtn').remove();
					}

					var viewEach = ( res.data.taskObj && res.data.taskObj.isViewEach ) || 0;
                    $('#isViewEach').val(viewEach)
					//心得列表绘制
                    MiniCourse.ListDraw(1, pagesize);

                } else {
                    $('.DescriptionBox').addClass('hidden');
                    $('.Description').html('');
                }

            }
        });
    },
    //增加浏览量
    Viewed: function () {
        var _token = $.getToken();
        $.ajax({
            url: BASE_API_URL + '/api-service-course/tpres/resource/views?r=' + Math.random(),
            data: {
                courseId: $.getRequest('courseid'),
                resId: $.getRequest('resid')
            },
            type: 'POST',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
                //初始化
                MiniCourse.Init();
            }
        });
    },
    //音/视频控制 STUDY_RESOURCE-API-SERVICE-10003  get请求得是线路
    Video: function (video_type) {
        var _token = $.getToken();
        var resId = parseInt($.getRequest('resid'));
        var taskId = $.getRequest('taskid');
        $.ajax({
            url: BASE_API_URL + '/api-service-course/tpres/resource/view/lines?r=' + Math.random(),
            data: {
                resId:resId,
                taskId:taskId
            },
            type: 'GET',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {

                if(res&&res.data){
                    var lineId = parseInt(res.data.lindId);
					//如果是校本资源，视频线路不能加https转换，播放源不能为9
					if (video_type == 'local' && lineId==9) {
						lineId = 8;
					}
                    // var lineId = res.data;
                    var currentTime = res.data.currentTime||0;
                    //获取音/视频地址
                    var isfirst=true;
                    hadCompleteTime = currentTime;
					if( xnLine.indexOf(lineId) >= 0 && video_type != 'local' ){
						//校内线路，需验证校内服务器是否可用
						MiniCourse.checkLocalCacheServer(''+localStorage.getItem('localIp')+'/favicon.ico', function(state){
							if(!state){
								if( resId > 0 ){
									lineId = 3
								} else {
									lineId = 9
								}
							}
							MiniCourse.GetVideo(isfirst,resId, lineId,hadCompleteTime);
							//切换播放源的相关操作
							MiniCourse.renderChangeLine(resId,lineId);
						});
					} else {
						//不是校内线路或者资源是校本资源，直接加载
						MiniCourse.GetVideo(isfirst,resId, lineId,hadCompleteTime);
						//切换播放源的相关操作
						MiniCourse.renderChangeLine(resId,lineId);
					}

					if( video_type && video_type == "local" ){
						$(".SourceList-warp").addClass("displayNone");
					}
                }

            },
            error:function (err) {
                $.getErrorMsg(err,'获取播放源')
            }
        });
    },
    //切换播放源的操作
    renderChangeLine:function (resId,lineId) {
        var List = [];

        //渲染
        if (resId > 0) {
			List.push('<li index="3" class="' + (lineId === 3 ? 'active' : '') + '">线路1<span class="ico01"></span></li>');
			List.push('<li index="1" class="' + (lineId === 1 ? 'active' : '') + '">山东联通<span class="ico01"></span></li>');
			List.push('<li index="5" class="' + (lineId === 5 ? 'active' : '') + '">湖北电信<span class="ico01"></span></li>');

            if (localStorage.getItem('localIp') && localStorage.getItem('localIp').length > 0) {
                List.push('<li index="7" class="' + (lineId === 7 ? 'active' : '') + '">校内<span class="ico01"></span></li>');
            }
        } else {
            if (localStorage.getItem('schoolLocalIp') && localStorage.getItem('schoolLocalIp').length > 0) {
                List.push('<li index="8" class="' + (lineId === 8 ? 'active' : '') + '">校内服务器<span class="ico01"></span></li>');
                List.push('<li index="9" class="' + (lineId === 9 ? 'active' : '') + '">校外服务器<span class="ico01"></span></li>');
            }
        }
        $('.VideoBox .SourceList ul').html(List.join(''));
        if (List.length === 0) {
            // $('.VideoBox .SourceList').addClass('hidden')
            $('.VideoBox .SourceList').addClass('displayNone')
        }


       if($('#sourceList')){
            var $this=$('#sourceList');
            $this.css('top', -($this.find('li').length * 20 + 35 ) + 'px');
        }
        // $('.VideoBox .SourceList-warp').off('click').on('click', function () {
        //     var $this = $(this);
        //     if ($this.find('ul').hasClass('displayNone')) {
        //         $this.find('ul').css('top', -($this.find('ul > li').length * 20) + 'px').removeClass('displayNone');
        //     } else {
        //         $this.find('ul').addClass('displayNone');
        //     }
        // });
        // $('.VideoBox .SourceList-warp').off('mouseover').on('mouseover', function () {
        //     var $this = $(this);
        //     $this.find('ul').css('top', -($this.find('ul > li').length * 20 ) + 'px').removeClass('displayNone');
        // });
        // $('.VideoBox .SourceList-warp').off('mouseout').on('mouseout', function () {
        //     var $this = $(this);
        //     $this.find('ul').addClass('displayNone');
        // });

        $('.SourceList .hint').removeClass('hidden');
        setTimeout(function () {
            $('.SourceList .hint').addClass('hidden');
        }, 3000);

		$('#sourceText').off('click').on('click', function () {
			if ($("#sourceList").hasClass('displayNone')) {
				$("#sourceList").removeClass('displayNone');
			} else {
				$("#sourceList").addClass('displayNone')
			}
		});

		$('.VideoBox .SourceList li').off('click').on('click', function () {
			var $this = $(this);
			var line = parseInt($this.attr('index'));
			var isfirst=false;
			$('.VideoBox .SourceList li').removeClass('active');
			$this.addClass('active');
			var resId = parseInt($.getRequest('resid'));
			if( xnLine.indexOf(line) >= 0 ){
				//校内线路，需验证校内服务器是否可用
				MiniCourse.checkLocalCacheServer(''+localStorage.getItem('localIp')+'/favicon.ico', function(state){
					if(!state){
						if( resId > 0 ){
							line = 3
						} else {
							line = 9
						}
					}
					MiniCourse.GetVideo(isfirst,resId, line);
				});
			} else {
				MiniCourse.GetVideo(isfirst,resId, line);
			}
		});

    },
	//检查服务器文件能够加载，用以判断服务状态。
	//function callbackfunc(state)。state为服务器状态，传给回调函数。true=服务中，false=不响应。
	checkLocalCacheServer: function(url, callback){
		$("#ettCacheServerCheckMark").remove();
		$("body").append('<img style="display:none" id="ettCacheServerCheckMark" />');
		$("#ettCacheServerCheckMark").attr("src",url+"?_="+new Date().getTime());
		var mark = false;
		var onOff = false;
		var time = setTimeout(function () {
            onOff = true;
            (callback && typeof(callback) === "function") && callback.call(mark,mark);
        }, 2000);
		$("#ettCacheServerCheckMark").load(function(){
		    if (!onOff) {
                mark = true;
                onOff = true;
                clearTimeout(time);
                (callback && typeof(callback) === "function") && callback.call(mark,mark);
            }
		});
	},
    //获取音/视频地址 STUDY_RESOURCE-API-SERVICE-10003  post请求得是视频地址和图片
    GetVideo: function (isfirst, resId, line, start) {
        var _token = $.getToken();
        Timer && clearInterval(Timer);

        var isUseJwplayer = MiniCourse.isUseJwplayer();
        var _width = $('#VideoPlayer').width();
        var _height = $('#VideoPlayer').width() * 0.5;
        //初始化音/视频组件 仅首次需要初始化
        if (isfirst) {
            if (!isUseJwplayer) {
                $('#video').css({
                    width: _width,
                    height: _height
                });
                video_player = videojs('video', {
                    aspectRatio: '16:9',
                    // inactivityTimeout: 0,
                    fluid: true
                    //slider: false
                }, function () {
                    MiniCourse.videoPlayerMonitor(this);
                });
            } else {
                $('#video').remove();
                $('#VideoPlayer').append('<div id="video"></div>');
                // 配置参数
            }
            // pad 不执行hover事件
            if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) ||
                navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) ||
                navigator.userAgent.match(/Windows Phone/i)) {
                var onOff = true;
                $(".videoController").removeClass('hidden')
                $('.videoController').click(function () {
                    if(onOff){
                        video_player.play();
                        onOff = false;
                    }else{
                        video_player.pause();
                        onOff = true;
                    }
                })
            }
        }
        //判断是使用Jwplayer的配置
        if (isUseJwplayer) {
            var jwplayerSetup = {
                'flashplayer': "../js/components/jwplayer/jwplayer69/jwplayer.flash.swf",
                'html5player': '../js/components/jwplayer/jwplayer69/jwplayer.html5.js',
                'id': 'player' + new Date().getTime(),
                'width': _width,
                'height': _height,
                'primary': 'html5',
                'analytics': {
                    'cookies': false,
                    'enabled': false
                },
                'startparam': "start",
                'autostart': "false",
				'abouttext': "Etiantian.com",
				'aboutlink': "http://www.etiantian.com",
				'preload': "metadata",
                'androidhls': "true",
                'provider' : 'video',
                'events': {}
            };
            jwplayer.key = 'TS4qsaxnmU61G+MTcWh8YKllWcQ=';
        }
        //获取播放源 STUDY_RESOURCE-API-SERVICE-10003
        $.ajax({
            url: BASE_API_URL + '/api-service-course/tpres/video/line?r=' + Math.random(),
            data: {
                resId: resId,
                line: line
            },
            type: 'POST',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {

                if (res && res.data) {
                    if (!isUseJwplayer) {
                        //更换视频的地址
						var videourl = res.data.videoUrl || "";
						var _http = window.location.protocol || "https";
						if( line == 9 ){
							//校外线路，需要修改http协议
							videourl = _http + videourl.substr(videourl.indexOf(":")+1);
						} else {
							//标准资源，需要拼协议
							var _protocol = videourl.substr(0,videourl.indexOf(":")+1);
							if( _protocol != "http:" && _protocol != "https:" ){
								videourl = _http + videourl;
							}
						}

                        video_player.poster(res.data.imageUrl);
                        video_player.src(videourl);
                        video_player.load(videourl);
                        //定点播放
                        video_player.currentTime(hadCompleteTime);

						//视频标题和时长信息的展示
                        if (video_player.readyState() < 1) {
                            video_player.one("loadedmetadata", function () {
                                var minutes = parseInt(parseInt(video_player.duration()) / 60, 10);
                                var seconds = parseInt(video_player.duration()) % 60;
                                $('#VideoPlayer .Vtime span').html(minutes + '分钟' + seconds + '秒');
                            });
                        }
                        else {
                            var minutes = parseInt(parseInt(video_player.duration()) / 60, 10);
                            var seconds = parseInt(video_player.duration()) % 60;
                            $('#VideoPlayer .Vtime span').html(minutes + '分钟' + seconds + '秒');
                        }
					}
                    else {
                        //jwplayer 配置视频
                        var videourl = res.data.videoUrl || "";
						var _http = window.location.protocol || "https";
						if( line == 9 ){
							//校外线路，需要修改http协议
							videourl = _http + videourl.substr(videourl.indexOf(":")+1);
						} else {
							//标准资源，需要拼协议
							var _protocol = videourl.substr(0,videourl.indexOf(":")+1);
							if( _protocol != "http:" && _protocol != "https:" ){
								videourl = _http + videourl;
							}
						}
                        var imagepath = res.data.imageUrl;
                        jwplayerSetup.file = videourl;
                        jwplayerSetup.image = imagepath;
                        video_player = jwplayer('video').setup(jwplayerSetup);
                        MiniCourse.jwPlayerMonitor();

                        //定点播放
						if( isfirst ){
							video_player.seek(hadCompleteTime).pause();
						} else {
							video_player.seek(hadCompleteTime);
						}


                    }
                }

            },
            error: function (res) {
                $.getErrorMsg(res,'获取视频内容');
            }
        });
    },
    //判断资源是否已收藏
    GetCollectionStatus: function () {
        var _token = $.getToken();
        var _resid = $.getRequest('resid');
        $.ajax({
            url: BASE_API_URL + '/api-service-course/tpres/collection?r=' + Math.random(),
            data: {
                resId: _resid
            },
            type: 'GET',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
                var $Collection = $('.SourceBox .collection');
                if (res.data === '1') {
                    $Collection.addClass('clicked');
                    $Collection.find('.CollectionFont').html('取消收藏');
                    $Collection.find('img').attr('src', '../images/discuss/collection_hover.png');
                } else {
                    $Collection.removeClass('clicked');
                    $Collection.find('.CollectionFont').html('收藏');
                    $Collection.find('img').attr('src', '../images/discuss/collection.png');
                }
            }
        });
    },
    //收藏/取消收藏
    Collection: function () {
        var _token = $.getToken();
        var _resid = $.getRequest('resid');
        var _courseid = $.getRequest('courseid');
        $('.SourceBox .collection').off('click').on('click', function () {
            var $this = $(this);
            if ($this.attr("restrict")) {
                return false
            }
            $this.attr("restrict", true);
            if ($this.hasClass('clicked')) {
                $.ajax({
                    url: BASE_API_URL + '/api-service-course/tpres/do-cancel-collect/res-id/' + _resid + '/course-id/' + _courseid + '?r=' + Math.random(),
                    data: {},
                    type: 'DELETE',
                    dataType: 'JSON',
                    beforeSend: function (request) {
                        request.setRequestHeader('Authorization', _token);
                    },
                    success: function (res) {
                        $this.removeClass('clicked');
                        $this.find('img').attr('src', '../images/discuss/collection.png');
						var Collection = $('.SourceBox .CollectionNum').html();
						var num = parseInt(Collection.substring(1, Collection.length - 1));
						$('.SourceBox .CollectionNum').html('(' + (num - 1) + ')');
						$('.SourceBox .collection .CollectionFont').html('收藏');
						layui.use(['layer'], function () {
							var layer = layui.layer;
							layer.ready(function(){
								layer.msg('取消成功');
							});
						});
                        $this.removeAttr("restrict");
                    },
                    error: function () {
                        layui.use(['layer'], function () {
                            layui.layer.msg('取消失败');
                        })
                    }
                });
            } else {
                $.ajax({
                    url: BASE_API_URL + '/api-service-course/tpres/resource/collection?r=' + Math.random(),
                    data: {
                        resId: $.getRequest('resid'),
                        courseId: $.getRequest('courseid')
                    },
                    type: 'POST',
                    dataType: 'JSON',
                    beforeSend: function (request) {
                        request.setRequestHeader('Authorization', _token);
                    },
                    success: function (res) {
                        $('.SourceBox .collection').removeClass("restrict")
                        $this.addClass('clicked');
                        $this.find('img').attr('src', '../images/discuss/collection_hover.png');
						var Collection = $('.SourceBox .CollectionNum').html();
						var num = parseInt(Collection.substring(1, Collection.length - 1));
						$('.SourceBox .CollectionNum').html('(' + (num + 1) + ')');
						$('.SourceBox .collection .CollectionFont').html('取消收藏');
						layui.use(['layer'], function () {
							var layer = layui.layer;
							layer.ready(function(){
								layer.msg('收藏成功');
							});
						});
                        $this.removeAttr("restrict");
                    },
                    error: function () {
                        layui.use(['layer'], function () {
                            layui.layer.msg('收藏失败');
                        })
                    }
                });
            }
        });
    },
    //获取下载链接
    GetDownLoad: function () {
        var _token = $.getToken();
        $('.SourceBox .js-download-video').off('click').on('click', function () {
          $.ajax({
                url: BASE_API_URL + '/api-service-course/tpres/resource/download-url?r=' + Math.random(),
                data: {
                    resId: $.getRequest('resid')
                },
                type: 'GET',
                dataType: 'JSON',
                beforeSend: function (request) {
                    request.setRequestHeader('Authorization', _token);
                },
                success: function (res) {
                    if (res.code === 1) {
                        $.ajax({
                            url: BASE_API_URL + '/api-service-general/encryption?r=' + Math.random(),
                            data: JSON.stringify({
                                fileName: $('#fileName').val(),
                                filePath: res.data,
                                r: Math.random()
                            }),
                            type: 'POST',
                            dataType: 'JSON',
                            async: false,
                            contentType: 'application/json;  charset=utf-8',
                            beforeSend: function (request) {
                                request.setRequestHeader('Authorization', _token);
                            },
                            success: function (getUrl) {
                                if (res.code === 1) {
                                    // 执行下载
                                    //window.open(BASE_API_URL_WEBUPLOAD + '/files/downloadAttachment/' + getUrl.data + '');

									var url = BASE_API_URL_WEBUPLOAD + '/files/downloadAttachment/' + getUrl.data + '';
									if (navigator.userAgent.match(/axpzhkt/i)) {
										url = window.location.protocol + url;
										alert(JSON.stringify({"type":1,"url":url}));
									} else {
										//window.location.href = url;
										window.open(url);
									}

                                    //增加下载量
                                    MiniCourse.AddDownLoad();
                                } else {
                                    layui.use(['layer'], function () {
                                        layui.layer.msg(res.msg || '下载失败');
                                    });
                                }
                            }
                        });
                    } else {
                        layui.use(['layer'], function () {
                            layui.layer.msg(res.msg || '下载失败');
                        });
                    }
                }
            });
        });
    },
    //增加下载量
    AddDownLoad: function () {
        var _token = $.getToken();
        $.ajax({
            url: BASE_API_URL + '/api-service-course/tpres/resource/download/counts?r=' + Math.random(),
            data: {
                resId: $.getRequest('resid')
            },
            type: 'POST',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
                var Download = $('.SourceBox .DownloadNum').html();
                var num = parseInt(Download.substring(1, Download.length - 1));
                $('.SourceBox .DownloadNum').html('(' + (num + 1) + ')');
            }
        });
    },
    //提交学习心得
    SubList: function () {
        var _token = $.getToken();
        $('.Discuss .UploadBox .submit').off('click').on('click', function () {

            var fileNum = $('#thelist .success').length;
            var files = [];
            for (var i = 0; i < fileNum; i++) {
                files.push($('#thelist .success').eq(i).attr('filepath'))
            }
            var _discussVal=$.trim($('.Discuss .UploadBox .FontLoad').val());
            if ((!_discussVal)&&(files.length==0)) {
                layui.use(['layer'], function () {
                    // layui.layer.msg('学习心得不能为空', {offset: '80px'});
                    layui.layer.msg('您还没有作答');
                });
                return;
            }
            if(_discussVal&&(_discussVal.length > 2000)){
                layui.use(['layer'], function () {
                    layui.layer.msg('学习心得不能超过2000个字符');
                });
                return
            }
            $.ajax({
                url: BASE_API_URL + '/api-service-course/tpres/tasks/study-notes?r=' + Math.random(),
                data: {
                    courseId: $.getRequest('courseid'),
                    taskId: $.getRequest('taskid'),
                    resId: $.getRequest('resid'),
                    answerContent: $('.Discuss .UploadBox .FontLoad').val(),
                    imgFile: files.join(',')
                },
                type: 'POST',
                dataType: 'JSON',
                beforeSend: function (request) {
                    request.setRequestHeader('Authorization',  _token);
                },
                success: function (res) {
                    if (res.code === 1) {
                        //心得列表绘制
                        MiniCourse.ListDraw(1, pagesize);
                        $('#thelist .item').not('.webuploader-container').remove();
                        $('.Discuss .UploadBox .FontLoad').val('');
                        layui.use(['layer'], function () {
                            var layer = layui.layer;
                            layer.ready(function(){
                                layer.msg('提交成功');
                            });
                        });
                        // layer.open({
                        //     closeBtn: 0,
                        //     btnAlign: 'c',
                        //     move: false,
                        //     resize: false,
                        //     area: ['900px', '540px'],
                        //     shade: [0.5, '#000000'],
                        //     shadeClose: false,
                        //     type: 1,
                        //     time: '2000',
                        //     title: false,
                        //     skin: 'nobg',
                        //     content: $('.award-box')
                        // });
                    } else {
                        layui.use(['layer'], function () {
                            layui.layer.msg(res.msg);
                        });
                    }
                },
                error: function (res) {
                    layui.use(['layer'], function () {
                        layui.layer.msg('提交失败');
                    });
                }
            });
        });
    },
    //心得列表绘制STUDY_RESOURCE-API-SERVICE-10002
    ListDraw: function (pageno, pagesize, viewEach) {
        var _token = $.getToken();
        var _taskid = $.getRequest('taskid');
        $.ajax({
            url: BASE_API_URL + '/api-service-course/tpres/stu-notes?r=' + Math.random(),
            data: {
                taskId: _taskid,
                rows: pagesize,
                page: pageno
            },
            type: 'GET',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
                // console.log("STUDY_RESOURCE-API-SERVICE-10002",res);
                if(res&&res.data){
                    if (((res.data.total > res.data.pageSize) && (res.data.total > 10))) {
                        //初始化分页
                        MiniCourse.Paging(res.data.total, res.data.pageNum, res.data.pageSize);
                    }
                    /*$.ajax({
                        url: BASE_API_URL + '/api-service-course/tpres/cdn-url?r=' + Math.random(),
                        data: {},
                        type: 'GET',
                        dataType: 'JSON',
                        beforeSend: function (request) {
                            request.setRequestHeader('Authorization', _token);
                        },
                        success: function (ip) {
                            localStorage.setItem('localIp', ip.data.localIp);
                            localStorage.setItem('schoolLocalIp', ip.data.schoolLovalIp);*/

                            var html = [];
                            if (res && res.data && res.data.list && res.data.list.length>0) {
                                $('.PrimaryDiscuss .UploadBox').remove();
                                res.data.list.forEach(function (item) {
                                    html.push('<div class="ReplyBox clearfix">');
                                    html.push('<div class="IconBox">');
                                    html.push('<div class="Icon" title="' + item.toRealName + '">');
                                    if (!item.headImage || item.headImage == null || item.headImage === '' || item.headImage == undefined) {
                                        html.push('<img src="../images/defaulthead.png">');
                                    } else {
                                        html.push('<img src="' + item.headImage + '"/>');
                                    }
                                    html.push('</div>');
                                    if (item.userName.length < 6) {
                                        html.push('<div class="name" title="' + item.userName + '" userId="' + item.userId + '">' + item.userName + '</div>');
                                    } else {
                                        html.push('<div class="name" title="' + item.userName + '" userId="' + item.userId + '">' + item.userName.substring(0, 5) + '...</div>');
                                    }
                                    if (TASKSTATUS !== '3' && parseInt(item.editFlag) === 1) {
                                        html.push('<div class="AppendBtn" userName="' + item.userName + '" userId="' + item.userId + '" taskType="' + item.taskType + '" quesParentId="' + item.quesParentId + '"">' +
                                            // '<i class="layui-icon">&#xe654;</i>追答' +
                                            '<a class="add-more-study-note"></a>'+
                                            '</div>');
                                    }
                                    html.push('</div>');
                                    html.push('<div class="ContentBox clearfix">');
                                    html.push('<div class="InfoRow clearfix">');
                                    // html.push('<div class="main">[我的作答]</div>');
                                    html.push('<div class="time">' + (item.cTimeStr || '') + '</div>');
                                    html.push('</div>');
                                    if(item.answerContent){
                                        html.push('<div class="ContentRow" readonly="readonly">' + item.answerContent + '</div>');
                                    }
                                    if(item.replyAttachType == 1){
                                        var str = '<div class="clearfix"><div class="audio-box clearfix hidden-audio-box"><div class="audio"><img class="overed" src="../images/discuss/play.png"><img class="playing  hidden" src="../images/discuss/pause.png"><img class="overed" src="../images/discuss/audio.png"><img class="playing hidden" src="../images/discuss/audio.gif"><audio src="'+item.replyAttach+'" preload=""></audio></div></div></div>'
                                        html.push(str)
                                    }else if(item.replyAttachType == 2){
                                        if (item.replyAttachList.length > 0 && (item.stuTaskRecordMarkingResultDTOS === undefined || item.stuTaskRecordMarkingResultDTOS.length === 0)) {
                                            html.push('<div class="ImgList clearfix">');
                                            item.replyAttachList.forEach(function (img) {
                                                ImgBig = img.lastIndexOf(".");
                                                html.push('<div class="ImgBox">');
                                                html.push('<img src="' + img.slice(0, ImgBig) + img.substring(ImgBig, img.length) + '" class="bigimg" ' +
                                                    ' data-original="' + img.slice(0, ImgBig) + '_1' + img.substring(ImgBig, img.length) + '"/>');
                                                html.push('</div>');
                                            });
                                            html.push('</div>');
                                        } else {
                                            html.push('<div class="ImgList clearfix">');
                                            if (item.replyAttach) {
                                                ImgBig = item.replyAttach.lastIndexOf(".");
                                                html.push('<div class="ImgBox">');
                                                // html.push('<img src="' + item.replyAttach + '" class="bigimg" />');
                                                html.push('<img src="' + item.replyAttach.slice(0, ImgBig) + item.replyAttach.substring(ImgBig, item.replyAttach.length) + '" class="bigimg" ' +
                                                    ' data-original="' + item.replyAttach.slice(0, ImgBig) + '_1' + item.replyAttach.substring(ImgBig, item.replyAttach.length) + '"/>');
                                                html.push('</div>');
                                            }
                                            item.stuTaskRecordMarkingResultDTOS.forEach(function (ietm) {
                                                ImgBig = item.attach.lastIndexOf(".");
                                                html.push('<div class="ImgBox">');
                                                html.push('<img src="' + item.attach.slice(0, ImgBig) + item.attach.substring(ImgBig, item.attach.length) + '" class="bigimg"' +
                                                    ' data-original="' + item.attach.slice(0, ImgBig) + '_1' + item.attach.substring(ImgBig, item.attach.length) + '"/>');
                                                // html.push('<img src="' + ietm.attach + '" class="bigimg"/>');
                                                if (parseInt(ietm.score) === -1) {
                                                    html.push('<div class="score">未打分</div>');
                                                } else {
                                                    html.push('<div class="score">' + ietm.score + '分</div>');
                                                }
                                                if (ietm.markName.length > 6) {
                                                    html.push('<div class="markName" title="' + ietm.markName + '">' + '批阅人：' + ietm.markName.substring(0, 7) + '...</div>');
                                                } else {
                                                    html.push('<div class="markName">' + '批阅人：' + ietm.markName + '</div>');
                                                }
                                                html.push('</div>');
                                            });
                                            html.push('</div>');
                                        }
                                    }
                                    if (item.appendList && item.appendList.length > 0) {
                                        html.push('<div class="AppendRow">');
                                        item.appendList.forEach(function (append, index) {
                                            html.push('<div class="title clearfix">');
                                            html.push('<p>追答 ' + (index + 1) + '</p>');
                                            html.push('<div class="time">' + (append.cTimeStr || '') + '</div>');
                                            html.push('</div>');
                                            //content 追答文字内容
                                            if(append.answerContent){
                                                html.push('<div class="append" readonly="readonly" autoHeight="true" >' + append.answerContent + '</div>');
                                            }
                                            if (append.replyAttachList.length > 0) { //追答的图片内容
                                                if(append.replyAttachType == 1){
                                                    var str = '<div class="clearfix"><div class="audio-box clearfix hidden-audio-box"><div class="audio"><img class="overed" src="../images/discuss/play.png"><img class="playing  hidden" src="../images/discuss/pause.png"><img class="overed" src="../images/discuss/audio.png"><img class="playing hidden" src="../images/discuss/audio.gif"><audio src="'+append.replyAttach+'" preload=""></audio></div></div></div>'
                                                    html.push(str)
                                                }else if(append.replyAttachType == 2) {
                                                    html.push('<div class="ImgList clearfix">');
                                                    append.replyAttachList.forEach(function (img) {
                                                        ImgBig = img.lastIndexOf(".");
                                                        html.push('<div class="ImgBox">');
                                                        html.push('<img src="' + img.slice(0, ImgBig) + img.substring(ImgBig, img.length) + '" class="bigimg"' +
                                                            'data-original="' + img.slice(0, ImgBig) + '_1' + img.substring(ImgBig, img.length) + '"/>');
                                                        html.push('</div>');
                                                    });
                                                    html.push('</div>');
                                                }
                                            }
                                        });
                                        html.push('</div>');
                                    }

                                    html.push('<div class="BarRow clearfix">');


                                    if (item.isPraise) {
                                        html.push('<div class="likes liked">');
                                        html.push('<img src="../images/discuss/liked.png"/>');
                                        html.push('<span ref="' + item.ref + '">(' + (item.praiseCount || '0') + ')</span>');
                                        html.push('</div>');
                                    } else {
                                        html.push('<div class="likes">');
                                        html.push('<img src="../images/discuss/like.png"/>');
                                        html.push('<span ref="' + item.ref + '">(' + (item.praiseCount || '0') + ')</span>');
                                        html.push('</div>');
                                    }
                                    // 回复数没找到。。。
                                    html.push('<div class="reply" ref="' + item.ref + '"" courseId="' + item.courseId + '" taskId="' + item.taskId + '">');
                                    html.push('<img src="../images/discuss/thesised.png"/>');
                                    html.push('<span ref="' + item.ref + '" data-num="'+(item.replyNum || '0')+'">'+' (' + (item.replyNum || '0') + ')</span>');
                                    html.push('</div>');

                                    html.push('</div>');
                                    html.push('</div>');
                                    html.push('</div>');
                                });
                            }
                            else {
                                html.push('<div class="NoData">还没有学生提交心得</div>');
                            }
                            $('.Discuss .ReplyList').html(html.join(''));
                            if( (TASKSTATUS == TASK_END_STATUS)){
                                $('.NoData').show();
                            }
							if($('#isViewEach').val() === '1'){
                                //isViewEach  0：不可以互相查看 1：可以互相查看
                                $('.Discuss .disnum').html((res.data.total||0));
                            }


                            $(function () {
                                $.fn.autoHeight = function () {
                                    function autoHeight(elem) {
                                        elem.style.height = 'auto';
                                        elem.scrollTop = 0; //防抖动
                                        elem.style.height = elem.scrollHeight + 'px';
                                    }

                                    this.each(function () {
                                        autoHeight(this);
                                        $(this).on('keyup', function () {
                                            autoHeight(this);
                                        });
                                    });
                                };
                                $('textarea[autoHeight]').autoHeight();
                            });


                            //点赞/取消点赞
                            MiniCourse.LikesClick();

                            //获取回复列表
                            MiniCourse.GetReply();

                            //追加心得
                            MiniCourse.AddList();

                            //图片查看
                            // MiniCourse.ImgView();
                            $.checkViewImg($('.ReplyBox .ContentBox .ImgList'),'data-original');

                            //点赞的hover事件
                            MiniCourse.likedHover();

                            //回复按钮的hover事件
                            MiniCourse.replyHover();

                            //音频播放事件
                            MiniCourse.AudioPlay();

                        //}
                    //});
                } else {
                    $('.Discuss .ReplyList').html('<div class="NoData">还没有学生提交心得</div>');
                    if( (TASKSTATUS == TASK_END_STATUS)){
                        $('.NoData').show();
                    }

                }
            },
            error: function (e) {

            }
        });
    },
    //心得列表分页
    Paging: function (count, curr, limit) {
        layui.use('laypage', function () {
            var laypage = layui.laypage;

            //执行一个laypage实例
            laypage.render({
                elem: 'paging' //注意，这里的 paging 是 ID，不用加 # 号
                , count: count //数据总数，从服务端得到
                , limit: limit
                , layout: ['count', 'prev', 'page', 'next', 'refresh', 'skip']
                , prev: '<em>←</em>'
                , next: '<em>→</em>'
                , theme: '#1E9FFF'
                , curr: curr
                , jump: function (obj, first) {
                    //首次不执行
                    if (!first) {
                        MiniCourse.ListDraw(obj.curr, obj.limit);
                    }
                }
            });
        });
    },
    //追加心得
    AddList: function () {
        var _token = $.getToken();
        $('.ReplyBox .AppendBtn').off('click').on('click', function () {
            var $this = $(this);
            // console.log($this.parents('.ReplyBox').find('.AppendRow .title').length);
            if ($this.parents('.ReplyBox').find('.AppendRow .title').length == 2) {
                layui.use(['layer'], function () {
                    var layer = layui.layer;
                    layer.open({
                        type: 1,
                        title: '提示',
                        skin: 'ecampus-class',
                        closeBtn: 1,
                        btnAlign: 'c',
                        move: false,
                        shade: [0.5, '#000000'],
                        shadeClose: true,
                        area: ['500px', '200px'],
                        content: '<div class="pl70 pr70">对不起，最多只能追答两次</div>',
                        btn: ['知道了'],
                        //确认删除回复
                        yes: function (index, layero) {
                            layer.close(index);
                        }
                    });
                });
            } else {
                $('#AddList .FontLoad').val('');
                $('#ImgAdd').addClass('HideBox');
                $('#Adduploader .TipFont span').html(0);
                $('#AddUploadList .success').remove();
                $('#ImgAdd').removeClass('hidden');
                $this.parents('.layui-layer-content').addClass('inherit');
                var _skinclass=null;
                var _area=['900px', '450px'];
                if($.getos()===2){
                    _skinclass='ipad-discuss-dialog';
                    _area= ['900px', '370px']
                }
                layui.use(['layer'], function () {
                    var layer = layui.layer;
                    layer.open({
                        closeBtn: 0,
                        btnAlign: 'c',
                        move: false,
                        resize: false,
                        area: _area,
                        skin: _skinclass,
                        shade: [0.5, '#000000'],
                        shadeClose: false,
                        type: 1,
                        title: false,
                        content: $('#AddList'),
                        success: function (layero, index) {
                            $("#addStudyNoteTextarea").off("keyup").on("keyup", function () {
                                $("#addStudyNoteTextarea").parent().find(".test-textarea-num").text($(this).val().length + "/2000")
                            })
                            //取消/关闭
                            $('#AddList .close').off('click').on('click', function () {
                                layer.close(index);
                                uploader_add.reset();
                            });
                            var $tasktype = $this.attr('tasktype');
                            var $quesParentId = $this.attr('quesParentId');

                            $('#AddList .submit').off('click').on('click', function () {

                                var fileNum = $('#AddUploadList .success').length;
                                var files = [];
                                for (var i = 0; i < fileNum; i++) {
                                    files.push($('#AddUploadList .success').eq(i).attr('filepath'))
                                }
                                if (files.length === 0) {
                                    var Num = '';
                                } else {
                                    var Num = 2;

                                }
                                var _fontLoadVal=$.trim($('#AddList .UploadBox .FontLoad').val());
                                if ((!_fontLoadVal) &&(files.length === 0) ) {
                                    layui.use(['layer'], function () {
                                        layui.layer.msg('您还没有作答');
                                        // layui.layer.msg('学习心得不能为空', {offset: '80px'});
                                    });
                                    return false;
                                }

                                if(_fontLoadVal&&(_fontLoadVal.length > 2000)){
                                    layui.use(['layer'], function () {
                                        layui.layer.msg('学习心得不能超过2000个字符');
                                    });
                                    return false;
                                }
                                $.ajax({
                                    url: BASE_API_URL + '/api-service-course/tpres/tasks/append/study-notes?r=' + Math.random(),
                                    data: {
                                        courseId: $.getRequest('courseid'),
                                        taskId: $.getRequest('taskid'),
                                        answerContent: $('#AddList .UploadBox .FontLoad').val(),
                                        objectType: $tasktype,
                                        objectId: $quesParentId,
                                        attachUrl: files.join(','),
                                        attachType: Num,
                                        type: 0
                                    },
                                    type: 'POST',
                                    dataType: 'JSON',
                                    beforeSend: function (request) {
                                        request.setRequestHeader('Authorization', _token);
                                    },
                                    success: function (res) {
                                        if (res.code === 1) {
                                            //心得列表绘制
                                            if ($('#paging').html() == '') {
                                                pageno = 1;
                                            } else {
                                                pageno = parseInt($(".layui-laypage-curr .layui-laypage-em").next().html());
                                            }
                                            MiniCourse.ListDraw(pageno, pagesize);
                                            $('#AddUploadList .item').not('.webuploader-container').remove();
                                            $('#AddList .UploadBox .FontLoad').val('');
                                            layui.use(['layer'], function () {
                                                var layer = layui.layer;
                                                layer.ready(function(){
                                                    layer.msg('提交成功');
                                                });
                                            });

                                            layer.close(index);
                                            uploader_add.reset();
                                        } else {
                                            layui.use(['layer'], function () {
                                                layui.layer.msg(res.data);
                                            });
                                        }
                                    },
                                    error: function (res) {
                                        layui.use(['layer'], function () {
                                            layui.layer.msg('提交失败');
                                        });
                                    }
                                });
                            })
                        },
                        end:function () {
                            $('body').css('overflow-y','auto');
                        }
                    })
                })
            }

        })
    },
    //显示回复列表
    GetReply: function () {
        $('.ReplyList .reply').off('click').on('click', function () {
            var $this = $(this);
            var $ContentBox = $this.parents('.ContentBox');
            var ref = $this.find('span').attr('ref');
            var _replynum=$this.children('span').attr('data-num');
            if(_replynum == 0){
                $this.removeClass('orhover');
                $this.find('img').attr('src', '../images/discuss/thesised.png');
                return;
            }

            if ($this.hasClass('active')) {
                $('.ReplyList .ListBox').remove();
                $('.ReplyList .reply').removeClass('active');
                // $('.ReplyList .reply>span').text('收起评论 ('+ _replynum+')');
            } else {
                $('.ReplyList .ListBox').remove();
                $('.ReplyList .reply').removeClass('active');
                // $('.ReplyList .reply>span').text('展开评论 ('+ _replynum+')');

                $this.addClass('active');

                var html = [];
                html.push('<div class="ListBox">');

                html.push('<div class="DarwReply"></div>');

                // html.push('<div class="ReplyInfo">');
                // // html.push('<script id="editor" name="content" type="text/plain"></script>');
                // // html.push('<div class="BtnRow">');
                // // html.push('<div class="layui-btn submit">提交</div>');
                // // html.push('<div class="layui-btn cancel">取消</div>');
                // // html.push('</div>');
                // html.push('</div>');

                html.push('</div>');

                $ContentBox.append(html.join(''));

                //绘制回复列表
                MiniCourse.DarwReply(ref);

                //回复输入框控制
                // MiniCourse.ToRaplyShow();

                //取消上传清空
                MiniCourse.ClearFallout();
            }
        });
    },
    //绘制回复列表
    DarwReply: function (ref) {
        var _token = $.getToken();
        $.ajax({
            url: BASE_API_URL + '/api-service-course/tpres/stu-replies?' + Math.random(),
            data: {
                quesId: ref
            },
            type: 'GET',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
                var html = [];
                if (res.data && res.data.length > 0) {
                    res.data.forEach(function (item) {
                        //isTeacher  判断是否是老师  1：是 0：否
                        if(item&&(item.isTeacher==1)){
                            var _itemstr = '';
                            _itemstr+='<div class="Reply clearfix hidden">';
                            _itemstr+='<div class="InfoRow clearfix">';
                            if (item.headImage) {
                                _itemstr+='<div class="IconBox"><img src="' + item.headImage + '" /></div>';
                            } else {
                                _itemstr+='<div class="IconBox"><img src="../images/defaulthead.png" /></div>';
                            }
                            _itemstr+='<div class="name">';
                            _itemstr+='<span class="replyName">' + item.userName + '</span>';
                            _itemstr+='</div>';
                            _itemstr+='<div class="time">' + item.cTimeStr + '</div>';
                            _itemstr+='</div>';
                            _itemstr+='<div class="ContentRow">';
                            _itemstr+='<p ref="' + item.ref + '">' + item.answerContent + '</p>';
                            _itemstr+='</div>';
                            _itemstr+='<div class="BarRow">';
                            // if (item.editFlag == 1) {
                            //     _itemstr+='<div class="DelBtn clearfix "><img class="DELICON" src="../images/discuss/delete.png" alt=""><span>删除</span></div>';
                            // }
                            _itemstr+='</div>';
                            _itemstr+='</div>';
                            html.push(_itemstr);
                        }
                    });
                }
                $('.ListBox .DarwReply').html(html.join(''));
                var Replynum = $('.ListBox .DarwReply .Reply').length;
                if (Replynum > 3) {
                    for (var i = Replynum; i >= 0; i--) {
                        if (i < 3) {
                            $('.ListBox .DarwReply .Reply').eq(i).removeClass('hidden');
                        }
                    }
                    var Replyhtml = '';
                    Replyhtml+='<div class="MoreRow clearfix">';
                    // Replyhtml+='<img class="moreBtn" src="../images/discuss/more.png">');
                    // Replyhtml+='<img class="showBtn hidden" src="../images/discuss/show.png">');
                    Replyhtml+='<p class="moreBtn">还有更多评论，<span style="color: #4AACEE">点击查看</span></p>';
                    Replyhtml+='<p class="showBtn hidden">评论太多，<span style="color: #4AACEE">点击收起</span></p>';
                    Replyhtml+='</div>';
                    $('.ListBox .DarwReply').append(Replyhtml);
                } else {
                    $('.ListBox .DarwReply .Reply').removeClass('hidden');
                }
                //删除回复
                // MiniCourse.DelRaply();

                //显示更多/收起更多
                $('.ListBox .moreBtn').off('click').on('click', function () {
                    $(this).addClass('hidden');
                    $(this).parents('.MoreRow').find('.showBtn').removeClass('hidden');
                    $(this).parents('.DarwReply').find('.Reply').removeClass('hidden');
                });

                $('.ListBox .showBtn').off('click').on('click', function () {
                    $(this).addClass('hidden');
                    $(this).parents('.MoreRow').find('.moreBtn').removeClass('hidden');
                    $(this).parents('.DarwReply').find('.Reply').removeClass('hidden');
                    var Replynum = $('.ListBox .DarwReply .Reply').length;
                    if (Replynum > 3) {
                        for (var i = Replynum; i >= 0; i--) {
                            if (i >= 3) {
                                $('.ListBox .DarwReply .Reply').eq(i).addClass('hidden');
                            }
                        }
                    }
                });

                //删除按钮的hover事件
                // MiniCourse.DELICONHover();
            },
            error: function (e) {

            }
        });
    },
    //回复输入框控制  and  提交回复
    ToRaplyShow: function () {
        UE.getEditor('editor').destroy();
        var ue = UE.getEditor('editor', {
            zIndex: 2000,
            wordCount: false,
            toolbars: [['emotion']],
            initialFrameHeight: 100,
            autoHeightEnabled: false
        });

        //取消
        $('.ListBox .ReplyInfo .cancel').off('click').on('click', function () {
            ue.setContent('');
            $('.ReplyList .reply').removeClass('active');
            $(this).parents('.ContentBox .ListBox').addClass('hidden');
        });

        //提交
        $('.ListBox .ReplyInfo .submit').off('click').on('click', function () {
            var _token = $.getToken();
            var _resid = $.getRequest('resid');
            var $reply = $(this).parents('.ReplyBox ').find('.reply span');
            var ref = $reply.attr('ref');
            var content = ue.getContent();
            var $this = $(this).parents('.ListBox').prev().find('.reply');
            if (content === '') {
                layui.use(['layer'], function () {
                    layui.layer.msg('回复不能为空');
                });
                return false;
            }

            $.ajax({
                url: BASE_API_URL + '/api-service-course/tpres/resource/stu-note/reply?' + Math.random(),
                data: {
                    quesId: $this.attr('ref'),
                    replyContent: content,
                    courseId: $this.attr('courseId'),
                    quesparentId: _resid,
                    taskId: $this.attr('taskId'),
                    type: '0'
                },
                type: 'POST',
                dataType: 'JSON',
                beforeSend: function (request) {
                    request.setRequestHeader('Authorization', _token);
                },
                success: function (res) {
                    if (res.code == '1') {
                        var reply = $reply.html();
                        var num = parseInt(reply.substring(1, reply.length - 1));
                        $reply.html('(' + (num + 1) + ')');
                        ue.setContent('');
                        MiniCourse.DarwReply(ref);
                        //绘制回复列表
                    } else {
                        ue.setContent('');
                        layui.use(['layer'], function () {
                            layui.layer.msg(res.msg);
                        });
                    }

                },
                error: function (e) {
                    layui.use(['layer'], function () {
                        layui.layer.msg('提交失败');
                    });
                }
            });


        });
    },
    //删除回复
    DelRaply: function () {
        var _token = $.getToken();
        $('.ListBox .DelBtn').off('click').on('click', function () {
            var $this = $(this);
            layui.use(['layer'], function () {
                var layer = layui.layer;
                layer.open({
                    type: 1,
                    title: '提示',
                    skin: 'ecampus-class',
                    closeBtn: 1,
                    btnAlign: 'c',
                    move: false,
                    shade: [0.5, '#000000'],
                    shadeClose: true,
                    area: ['500px', '200px'],
                    content: '<div class="pl70 pr70">是否确认删除心得（回复）？</div>',
                    btn: ['确定', '取消'],
                    //确认删除回复
                    yes: function (index, layero) {
                        layer.close(index)
                        var $reply = $('.ListBox .ReplyInfo .submit').parents('.ReplyBox ').find('.reply span');
                        var ref = $reply.attr('ref');
                        var uref = $this.parents('.BarRow').prev().find('p').attr('ref');
                        $.ajax({
                            url: BASE_API_URL + '/api-service-course/tpres/resource/stu-note/ref/reply/' + uref + '?' + Math.random(),
                            type: 'DELETE',
                            dataType: 'JSON',
                            beforeSend: function (request) {
                                request.setRequestHeader('Authorization', _token);
                            },
                            success: function (item) {
                                $this.parents('.Reply').remove();
                                MiniCourse.DarwReply(ref);
                            },
                            error: function (e) {
                                layui.use(['layer'], function () {
                                    layui.layer.msg('删除失败');
                                });
                            }
                        });

                        var ref = $('.ReplyBox  .reply.active').attr('ref');
                        var reply = $('.ReplyBox  .reply.active span').html();
                        var num = parseInt(reply.substring(1, reply.length - 1));
                        $('.ReplyBox  .reply.active span').html('(' + (num - 1) + ')');

                        //绘制回复列表
                        MiniCourse.DarwReply(ref);
                    },
                    //取消删除回复
                    btn2: function (index, layero) {
                        layer.close(index);
                    }
                });
            });
        });
    },
    //点赞的hover事件
    likedHover: function () {
        $('.ReplyList .likes').hover(function () {
            var $this = $(this);
            $this.addClass('orhover');
            $this.find('img').attr('src', '../images/discuss/liked.png');
        }, function () {
            var $this = $(this);
            if ($this.hasClass('liked')) {
                return false;
            }
            $this.removeClass('orhover');
            $this.find('img').attr('src', '../images/discuss/like.png');
        });
    },
    //回复按钮的hover事件
    replyHover: function () {
        $('.ReplyList .reply').hover(function () {
            var $this = $(this);
            $this.addClass('orhover');
            $this.find('img').attr('src', '../images/discuss/thesis.png');
        }, function () {
            var $this = $(this);
            $this.removeClass('orhover');
            $this.find('img').attr('src', '../images/discuss/thesised.png');
        });
    },
    //删除按钮的hover事件
    DELICONHover: function () {
        $('.ReplyList .DelBtn').hover(function () {
            var $this = $(this);
            $this.addClass('orhover');
            $this.find('img').attr('src', '../images/discuss/deleted.png');
        }, function () {
            var $this = $(this);
            $this.removeClass('orhover');
            $this.find('img').attr('src', '../images/discuss/delete.png');
        });
    },
    //点赞/取消点赞
    LikesClick: function () {
        var _token = $.getToken();
        $('.ReplyList .likes').off('click').on('click', function () {
            var $this = $(this);
            var $like = $this.find('span').html();
            var num = parseInt($like.substring(1, $like.length - 1));
            var ref = $this.find('span').attr('ref');

            if ($this.hasClass('liked')) {
                $.ajax({
                    url: BASE_API_URL + '/api-service-course/tpres/praise/study-notes?r=' + Math.random(),
                    data: {
                        objectId: ref,
                        type: 2
                    },
                    type: 'POST',
                    dataType: 'JSON',
                    beforeSend: function (request) {
                        request.setRequestHeader('Authorization', _token);
                    },
                    success: function (res) {
                        $this.removeClass('liked');
                        $this.find('img').attr('src', '../images/discuss/like.png');
                        $this.find('span').html('(' + (num - 1) + ')');
                        layui.use(['layer'], function () {
                            var layer = layui.layer;
                            layer.ready(function(){
                                layer.msg('取消成功');
                            });
                        });
                    },
                    error: function () {
                        layui.use(['layer'], function () {
                            layui.layer.msg('取消失败');
                        });
                    }
                })
            } else {
                $.ajax({
                    url: BASE_API_URL + '/api-service-course/tpres/praise/study-notes?r=' + Math.random(),
                    data: {
                        objectId: ref,
                        type: 1
                    },
                    type: 'POST',
                    dataType: 'JSON',
                    beforeSend: function (request) {
                        request.setRequestHeader('Authorization', _token);
                    },
                    success: function (res) {
                        if (res.code === 1) {
                            $this.addClass('liked');
                            $this.find('img').attr('src', '../images/discuss/liked.png');
                            $this.find('span').html('(' + (num + 1) + ')');
                            layui.use(['layer'], function () {
                                var layer = layui.layer;
                                layer.ready(function(){
                                    layer.msg('点赞成功');
                                });
                            });
                        } else {
                            layui.use(['layer'], function () {
                                layui.layer.msg(res.data);
                            });
                        }
                    },
                    error: function () {
                        layui.use(['layer'], function () {
                            layui.layer.msg('点赞失败');
                        });
                    }
                })
            }
        });
    },
    //上传清空
    ClearFallout: function () {
        $('.Discuss .UploadBox .cancel').off('click').on('click', function () {
            $('.Discuss .UploadBox .FontLoad').val('');
            $('#thelist .success').remove();
            $('#ImgPicker').removeClass('hidden');
            $('#uploader .TipFont span').html(0);
            uploader.reset();
        });
    },
    //  上传配置文件
    UploadImg: function () {
        var $upload=$('#summitMyStudyNote');
        var $disBtn=$('#disSummitBtn');
         uploader = new WebUploader.create({
            resize: false, // 不压缩image
            swf: "js/components/webuploader/0.1.5/Uploader.swf", // swf文件路径
            formData: {projectName: "logis"},
            server: BASE_API_URL_WEBUPLOAD + '/uploader/file/image', // 文件接收服务端。
            pick: '#picker,#ImgPicker', // 选择文件的按钮。可选
            auto: true, //选择文件后是否自动上传
            runtimeOrder: 'html5,flash',
            prepareNextFile: false,
            duplicate: false,
            thumb: {
                width: 600,
                height: 600,
                crop: false,
                allowMagnify: false
            },
            compress: false,
            threads: 1,
            accept: {
                title: 'Images',
                extensions: 'jpg,jpeg,png',
                mimeTypes: 'image/jpeg,image/png'
            }
        });

        uploader.on('all', function (type) {
            switch (type) {
                case 'uploadFinished':
                    $upload.show();
                    $disBtn.hide();
					//显示统一报错
					if( errorTipArr.length > 0 ){
						layui.use('layer', function () {
							var layer = layui.layer;
							layer.msg(errorTipArr.join("<br />"),function(){
								errorTipArr = [];
							});
						});
					}
                    break;

                case 'startUpload':
                    $upload.hide();
                    $disBtn.show();
                    break;

                case 'stopUpload':
                    $upload.show();
                    $disBtn.hide();
                    break;
            }
        });

		//多个文件加入队列之前触发
		uploader.on('filesQueued', function (file) {
			if ($('#thelist .item').length > 9) {
				layui.use(['layer'], function () {
					layui.layer.msg('最多只可以上传9张图片');
				});
				$('#ImgPicker').addClass('hidden');
				$('#ImgPicker').addClass('HideBox');
				$('#uploader .TipFont span').html(9);
				return false;
			}
		});

        // 当有文件被添加进队列的时候
        uploader.on('fileQueued', function (file) {
            var $list = $('#thelist-img');
            var $li = $(
                '<div id="' + file.id + '" class="item"  title="' + file.name + '">' +
                '<img class="bigimg">' +
                '<div class="info">' + file.name + '</div>' +
                '<div class="CloseBtn"><i class="layui-icon">&#x1006;</i></div>' +
                '</div>'
            );
            var $img = $li.find('img');

            if (file.size > 5 * 1024 * 1024) {
                uploader.removeFile(file);
                return false;
            }

            if ($('#thelist .item').length > 9) {
				/*layui.use(['layer'], function () {
					layui.layer.msg('最多只可以上传9张图片');
				});*/
                $('#ImgPicker').addClass('hidden');
                $('#ImgPicker').addClass('HideBox');
                $('#uploader .TipFont span').html(9);
                uploader.removeFile(file);
            } else if ($('#thelist .item').length === 9) {
                $('#ImgPicker').addClass('hidden');
                $('#ImgPicker').addClass('HideBox');
                // $list为容器追加元素
                $list.prepend($li);
                $('#uploader .TipFont span').html(9);
            } else {
                $('#ImgPicker').removeClass('hidden');
                $('#ImgPicker').removeClass('HideBox');
                // $list为容器追加元素
                $list.prepend($li);
                $('#uploader .TipFont span').html($('#thelist .item').length - 1);
            }


            // 创建缩略图
            // 如果为非图片文件，可以不用调用此方法。
            uploader.makeThumb(file, function (error, src) {
                if (error) {
                    $img.replaceWith('<span>无法预览</span>');
                    return;
                }

                $img.attr('src', src);

                $list.viewer({
                    navbar: false,
                    title: false,
                    movable: true,
                    fullscreen: false,
                    zoomable: true,
                    scalable: false,
                    tooltip: false
                });
            });
        });

        // 文件上传过程中创建进度条实时显示。
        uploader.on('uploadProgress', function (file, percentage) {
            var $li = $('#' + file.id),
                $percent = $li.find('.progress .progress-bar');

            // 避免重复创建
            if (!$percent.length) {
                $percent = $('<div class="progress progress-striped active">' +
                    '<div class="progress-bar" role="progressbar" style="width: 0">' +
                    '</div>' +
                    '</div>').appendTo($li).find('.progress-bar');
            }
            $percent.css('width', percentage * 100 + '%');
        });

        //上传成功
        uploader.on('uploadSuccess', function (file, res) {
            var $li = $('#' + file.id),
                $error = $li.find('div.error');
            $li.attr('filepath', res.filePath).addClass('success');

            // 避免重复创建
            if (!$error.length) {
                $error = $('<div class="error"></div>').appendTo($li);
                $error.text('上传成功');
            }
        });

        //上传出错
        uploader.on('uploadError', function (file) {
            var $li = $('#' + file.id),
                $error = $li.find('div.error');
            $li.addClass('filed');

            // 避免重复创建
            if (!$error.length) {
                $error = $('<div class="error"></div>').appendTo($li);
                $error.text('上传失败');
            }
        });

		uploader.onError = function (code,file) {
			if( errorTipArr.length <= 10 ){
				var name=file.name;
				switch( code ){
					case 'Q_EXCEED_SIZE_LIMIT':
						errorTipArr.push(name+'文件大小超出限制');
						break;
					case 'F_EXCEED_SIZE':
						errorTipArr.push(name+'文件大小超出限制');
						break;
					case 'Q_TYPE_DENIED':
						errorTipArr.push(name+'图片格式不正确，只允许jpg,jpeg,png');
						break;
					default:
						break;
				}
			}
		};

        //上传结束 无论成功与否
        uploader.on('uploadComplete', function (file) {
            $('#' + file.id).find('.progress').remove();

            $('#' + file.id).find('.CloseBtn').off('click').on('click', function () {
                $('#' + file.id).remove();
                uploader.removeFile(file);

                var num = $('#uploader .TipFont span').html();
                $('#uploader .TipFont span').html(num - 1);

                if ($('#thelist .CloseBtn').length < 1) {
                    $('#ImgPicker').addClass('HideBox');
                }


                if ($('#thelist .item').length > 9) {
                    $('#ImgPicker').addClass('hidden');
                    $('#ImgPicker').addClass('HideBox');
                } else if ($('#thelist .item').length === 9) {
                    $('#ImgPicker').removeClass('hidden');
                    $('#ImgPicker').removeClass('HideBox');
                } else {
                    $('#ImgPicker').removeClass('hidden');
                    $('#ImgPicker').removeClass('HideBox');
                    if ($('#thelist .item').length == 1) {
                        $('#ImgPicker').addClass('HideBox');
                    }
                }
            });
        });
    },
    //追答的上传配置文件
    UploadAddImg: function () {
        var $upload=$('#addStudyNote');
        var $disBtn=$('#disAddSummitBtn');

        uploader_add = new WebUploader.create({
            resize: false, // 不压缩image
            swf: "js/components/webuploader/0.1.5/Uploader.swf", // swf文件路径
            formData: {projectName: "logis"},
            server: BASE_API_URL_WEBUPLOAD + '/uploader/file/image', // 文件接收服务端。
            pick: '#Addpicker,#ImgAdd', // 选择文件的按钮。可选
            auto: true, //选择文件后是否自动上传
            runtimeOrder: 'html5,flash',
            prepareNextFile: false,
            duplicate: false,
            thumb: {
                width: 600,
                height: 600,
                crop: false,
                allowMagnify: false
            },
            compress: false,
            threads: 1,
            accept: {
                title: 'Images',
                extensions: 'jpg,jpeg,png',
                mimeTypes: 'image/jpeg,image/png'
            }
        });

        uploader_add.on('all', function (type) {
            switch (type) {
                case 'uploadFinished':
                    $upload.show();
                    $disBtn.hide();
					//显示统一报错
					if( adderrorTipArr.length > 0 ){
						layui.use('layer', function () {
							var layer = layui.layer;
							layer.msg(adderrorTipArr.join("<br />"),function(){
								adderrorTipArr = [];
							});
						});
					}
                    break;

                case 'startUpload':
                    $upload.hide();
                    $disBtn.show();
                    break;

                case 'stopUpload':
                    $upload.show();
                    $disBtn.hide();
                    break;

            }
        });

		//加入队列之前触发
		uploader_add.on('filesQueued', function (file) {
			if ($('#AddUploadList .item').length > 9) {
				layui.use(['layer'], function () {
					layui.layer.msg('最多只可以上传9张图片');
				});

				$('#ImgAdd').addClass('hidden');
				$('#ImgAdd').addClass('HideBox');
				$('#AddUploadList').addClass('AddUploadList-DHTML');
				$('#Adduploader .TipFont span').html(9);
				return false;
			}
		});

        // 当有文件被添加进队列的时候
        uploader_add.on('fileQueued', function (file) {
            var $list = $('#AddUploadList-img');
            var $li = $(
                '<div id="' + file.id + '" class="item"  title="' + file.name + '">' +
                '<img class="bigimg">' +
                '<div class="info">' + file.name + '</div>' +
                '<div class="CloseBtn"><i class="layui-icon">&#x1006;</i></div>' +
                '</div>'
            );
            var $img = $li.find('img');

            if (file.size > 5 * 1024 * 1024) {
                uploader_add.removeFile(file);
                return false;
            }


            if ($('#AddUploadList .item').length > 9) {
				/*layui.use(['layer'], function () {
					layui.layer.msg('最多只可以上传9张图片');
				});*/
                $('#ImgAdd').addClass('hidden');
                $('#ImgAdd').addClass('HideBox');
                uploader_add.removeFile(file);
                $('#Adduploader .TipFont span').html(9);
            } else if ($('#AddUploadList .item').length === 9) {
                $('#ImgAdd').addClass('hidden');
                $('#ImgAdd').addClass('HideBox');
                // $list为容器追加元素
                $list.prepend($li);
                $('#Adduploader .TipFont span').html(9);
            } else {
                $('#ImgAdd').removeClass('hidden');
                $('#ImgAdd').removeClass('HideBox');
                // $list为容器追加元素
                $list.prepend($li);
                $('#Adduploader .TipFont span').html($('#AddUploadList .item').length - 1);
            }


            // 创建缩略图
            // 如果为非图片文件，可以不用调用此方法。
            uploader.makeThumb(file, function (error, src) {
                if (error) {
                    $img.replaceWith('<span>无法预览</span>');
                    return;
                }

                $img.attr('src', src);

                $list.viewer({
                    navbar: false,
                    title: false,
                    movable: true,
                    fullscreen: false,
                    zoomable: true,
                    scalable: false,
                    tooltip: false
                });
            });

        });

        // 文件上传过程中创建进度条实时显示。
        uploader_add.on('uploadProgress', function (file, percentage) {
            var $li = $('#' + file.id),
                $percent = $li.find('.progress .progress-bar');

            // 避免重复创建
            if (!$percent.length) {
                $percent = $('<div class="progress progress-striped active">' +
                    '<div class="progress-bar" role="progressbar" style="width: 0">' +
                    '</div>' +
                    '</div>').appendTo($li).find('.progress-bar');
            }
            $percent.css('width', percentage * 100 + '%');
        });

        //上传成功
        uploader_add.on('uploadSuccess', function (file, res) {
            var $li = $('#' + file.id),
                $error = $li.find('div.error');
            $li.attr('filepath', res.filePath).addClass('success');
            // 避免重复创建
            if (!$error.length) {
                $error = $('<div class="error"></div>').appendTo($li);
                $error.text('上传成功');
            }
        });

        //上传出错
        uploader_add.on('uploadError', function (file) {
            var $li = $('#' + file.id),
                $error = $li.find('div.error');
            $li.addClass('filed');

            // 避免重复创建
            if (!$error.length) {
                $error = $('<div class="error"></div>').appendTo($li);
                $error.text('上传失败');
            }
        });

		uploader_add.onError = function (code,file) {
			if( errorTipArr.length <= 10 ){
				var name=file.name;
				switch( code ){
					case 'Q_EXCEED_SIZE_LIMIT':
						adderrorTipArr.push(name+'文件大小超出限制');
						break;
					case 'F_EXCEED_SIZE':
						adderrorTipArr.push(name+'文件大小超出限制');
						break;
					case 'Q_TYPE_DENIED':
						adderrorTipArr.push(name+'图片格式不正确，只允许jpg,jpeg,png');
						break;
					default:
						break;
				}
			}
		};

        //上传结束 无论成功与否
        uploader_add.on('uploadComplete', function (file) {
            $('#' + file.id).find('.progress').remove();

            $('#' + file.id).find('.CloseBtn').off('click').on('click', function () {
                $('#' + file.id).remove();
                uploader_add.removeFile(file);

                var num = $('#Adduploader .TipFont span').html();
                $('#Adduploader .TipFont span').html(num - 1);

                if ($('#thelist .CloseBtn').length < 1) {
                    $('#ImgAdd').addClass('HideBox');
                }

                if ($('#AddUploadList .item').length > 9) {
                    $('#ImgAdd').addClass('hidden');
                    $('#ImgAdd').addClass('HideBox');
                } else if ($('#AddUploadList .item').length === 9) {
                    $('#ImgAdd').removeClass('hidden');
                    $('#ImgAdd').removeClass('HideBox');
                } else {
                    $('#ImgAdd').removeClass('hidden');
                    $('#ImgAdd').removeClass('HideBox')
                    if ($('#AddUploadList .item').length == 1) {
                        $('#ImgAdd').addClass('HideBox');
                    }
                }
            });
        });
    },
    //点击测试去往做题页面
    goToMiniCoursesTest: function () {
        $('#goToMiniCoursesTest').off('click').click(function () {
            //当看完微课视频或者任务结束之后可以跳转
            var _this=$('#goToMiniCoursesTest');
            var _taskid = $.getRequest('taskid');
            var courseId=$.getRequest('courseid');
            var resId= $.getRequest('resid');
            var paperId=_this.attr('data-paperId');
            var userType=_this.attr('data-userType');
            var userTypeId=_this.attr('data-userTypeId');
            var classId=_this.attr('data-classId');
            var answerView=_this.attr('data-answerView');
            var finTaskFlag=_this.attr('data-finTaskFlag');
            if( (TASKSTATUS == TASK_END_STATUS)){
                window.location.href = './completeminicourse.html?taskId='+_taskid+'&paperId='+paperId+'&courseId='+courseId+'&resId='+resId;
            }else{
                if (IS_COMPLETE_VIDEO ==true) {
                    if(finTaskFlag=='true'){
                        /*该用户已完成测试*/
                        window.location.href = './completeminicourse.html?taskId='+_taskid+'&paperId='+paperId+'&courseId='+courseId+'&resId='+resId;
                    }else{
                        /*该用户未完成测试*/
                        window.location.href = './minicourses.html?taskId='+_taskid+'&paperId='+paperId+'&userType='+userType+'&userTypeId='+userTypeId+'&classId='+classId+'&courseId='+courseId+'&resId='+resId;
                    }
                } else {
                    layui.use(['layer'], function () {
                        layui.layer.msg('不用看微课，直接去测试页答题！');
                        MiniCourse.completeMiniVideo();
                    })
                }
            }
        })
    },
    //查询学生是否看完微课任务视频JIAOXUE-SERVICE-API-342
    isCompleteVideo: function () {
        var _token = $.getToken();
        var _courseid = $.getRequest('courseid');
        var _taskid = $.getRequest('taskid');
        var _resid = $.getRequest('resid');
        var _data = {
            courseId: _courseid,
            resId: _resid,
            taskId: _taskid
        };
        $.ajax({
            url: BASE_API_URL + '/api-service-course/paper-answers/video-task?r=' + Math.random(),
            data: _data,
            type: 'GET',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
                // console.log('查询学生是否看完微课任务视频JIAOXUEres)',res);
                if (res) {
                    IS_COMPLETE_VIDEO = !!res.data;
                    //去往其他页面
                    MiniCourse.goToMiniCoursesTest();
                }
            },
            error: function (err) {
            }
        });
    },
    //记录学生完成微课任务视频JIAOXUE-SERVICE-API-343
    completeMiniVideo: function () {
        var _token = $.getToken();
        var _courseid = $.getRequest('courseid');
        var _taskid = $.getRequest('taskid');
        var _resid = $.getRequest('resid');
        var _data = {
            courseId: _courseid,
            resId: _resid,
            taskId: _taskid
        };
        $.ajax({
            url: BASE_API_URL + '/api-service-course/paper-answers/video-task?r=' + Math.random(),
            data: _data,
            type: 'POST',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
                IS_COMPLETE_VIDEO = true;

				MiniCourse.saveUserWatchVideo(0);
                // 视频看完跳转到做题或者测试页
                $('#goToMiniCoursesTest').click();
            },
            error: function (err) {
            }
        });
    },
    //保存到kafka消息队列中(间隔5秒请求一次）http://192.168.10.8:8090/pages/viewpage.action?pageId=211910697
    dateSaveKafkaLog: function (position) {
        var _token = $.getToken();
        // var _courseid= $.getRequest('courseid');
        var _taskid = $.getRequest('taskid');
        var object_id = $.getRequest('resid');
        var task_type = 6;//任务类型 1资源 6微视频
        var jid = window.sessionStorage.getItem("test_jid");
        var sign = window.sessionStorage.getItem("test_sign");
        var timestamp = window.sessionStorage.getItem("test_timestamp");
        var _data = {
            sign: sign,
            timestamp: timestamp,
            servId: 0,
            srcId: 2,
            messageTypeId: 9,
            dbName: 'sxlogsdb',
            tableName: 'stu_action_data_log',
            jid: jid,
            sub_type: 301,
            task_id: _taskid,
            task_type: task_type,
            object_id: object_id,
            video_position: position
        };
        $.ajax({
            url: DATE_SAVE_QUEUE_API + '?r=' + Math.random(),
            data: _data,
            type: 'POST',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
            },
            error: function (err) {
            }
        });
    },
    /**
     * 获取时间秘钥[数据采集]
     * http://192.168.10.8:8090/display/shuzixiaoyuan/JIAOXUE-SERVICE-API-272
     */
    getDataSign: function () {
        var _token = $.getToken();
        $.ajax({
            url: BASE_API_URL + '/api-service-general/link-webs/action-service',
            type: "GET",
            dataType: "json",
            data: {
                r: Math.random()
            },
            beforeSend: function (request) {
                request.setRequestHeader("Authorization", _token);
            },
            success: function (d) {
                if (d.code == 1) {
                    window.sessionStorage.setItem("test_jid", d.data.jid);
                    window.sessionStorage.setItem("test_sign", d.data.sign);
                    window.sessionStorage.setItem("test_timestamp", d.data.timestamp);
                }
            },
            error: function (e) {
                $.getErrorMsg(e, "时间秘钥");
            }
        });
    },
    //获取到去往测试页面的参数
    minicoursesOtherParams:function () {
        var _taskId=$.getRequest('taskid');
        var _token = $.getToken();
        $.ajax({
            url: BASE_API_URL + '/api-service-general/task-allot-users/task/user',
            type: "GET",
            dataType: "json",
            data: {
                r: Math.random(),
                taskId:_taskId
            },
            beforeSend: function (request) {
                request.setRequestHeader("Authorization", _token);
            },
            success: function (d) {
                if (d && (d.code == 1) && d.data) {
                    var _taskInfo= d.data||{};
                    $('#goToMiniCoursesTest').attr('data-paperId',_taskInfo.paperId).attr('data-userType',_taskInfo.userType).attr('data-userTypeId',_taskInfo.userTypeId).attr('data-classId',_taskInfo.classId).attr('data-answerView',_taskInfo.answerView).attr('data-finTaskFlag',_taskInfo.finTaskFlag)
                }
            },
            error: function (e) {
                $.getErrorMsg(e, "时间秘钥");
            }
        });

    },
    //是否改用Jwplayer视频播放
    isUseJwplayer:function () {
        var _ieVersions=$.getIEVersion();
        if((_ieVersions >= 11)||(_ieVersions == -1)||(_ieVersions=='edge')){
            return false
        }else{
            return true
        }
    },
    //ie10jwplayer的监控行为
    jwPlayerMonitor:function(id){
        jwplayer('video').onSeek(function (event) {
            //event.offset > event.position向前拖动 反之向后
            Timer && clearInterval(Timer);
            videoTimer && clearInterval(videoTimer);
            //任务未结束,没看过的部分不能看.(不能看个屁，傻逼东西)
            //if(TASKSTATUS != TASK_END_STATUS){
            //    if (IS_COMPLETE_VIDEO == false) {
            //        if (event.offset > event.position) {
            //            if (hadCompleteTime < event.offset) {
            //                // console.log('超出您的已读范围');
            //                jwplayer('video').pause().seek(hadCompleteTime);
            //            }
            //        }
            //    }
            //}

        });
        jwplayer('video').onComplete(function () {
            // console.log("播放结束!!!");
            Timer && clearInterval(Timer);
            videoTimer && clearInterval(videoTimer);
            MiniCourse.completeMiniVideo();
        });
        jwplayer('video').onReady(function () {
            jwplayer('video').onTime(function () {
                var t = jwplayer('video').getDuration();
                $('#videoTime').html(parseInt(t / 60) + '分' + parseInt(t % 60) + '秒');
            })
        });
        jwplayer('video').onPlay(function () {
            Timer && clearInterval(Timer);
            videoTimer && clearInterval(videoTimer);
            Timer = setInterval(function () {
                var _currentTime = Math.floor(jwplayer('video').getPosition());
                if (_currentTime > hadCompleteTime) {
                    hadCompleteTime = _currentTime;
                }
                // console.log("大数据接口调用模拟",_currentTime);
                MiniCourse.dateSaveKafkaLog(_currentTime)
            }, 5000);
            videoTimer = setInterval(function () {
                var _currentTime2 = Math.floor(jwplayer('video').getPosition());
                // console.log("每30秒调用一次大连接口调用模拟",_currentTime2);
                MiniCourse.saveUserWatchVideo(_currentTime2)
            }, 30000)
        });
        jwplayer('video').onPause(function () {
            Timer && clearInterval(Timer);
            videoTimer && clearInterval(videoTimer);
            // console.log("暂停");
        });
    },
    //videojs 的监控行为
    videoPlayerMonitor:function(that){
        that.on('error', function () {
            Timer && clearInterval(Timer);
            videoTimer && clearInterval(videoTimer);
            $('#VideoPlayer .vjs-error .vjs-error-display .vjs-modal-dialog-content')
                .css('line-height', $('#VideoPlayer').width() * 0.5 + 'px');
        });
        // 用户改变播放位置(你监控你大爷)
        //that.on('seeked', function () {
        //    Timer && clearInterval(Timer);
        //    videoTimer && clearInterval(videoTimer);
        //    if(TASKSTATUS != TASK_END_STATUS){
        //        var _currentTime = Math.floor(video_player.currentTime());
        //        // console.log('用户改变播放位置seeked', _currentTime, hadCompleteTime);
        //        //任务未结束:没看过的部分不能快进(老子就让你能看怎么滴？)
        //        if (IS_COMPLETE_VIDEO == false) {
        //            if (_currentTime > hadCompleteTime) {
        //                that.pause();
        //                that.currentTime(hadCompleteTime);
        //            }
        //        }
        //    }

        //});
        that.on('play', function () {
            $('#videoTitle').hide();
            $('#VideoPlayer').mouseover(function () {
                $('#videoTitle').show();
            }).mouseout(function () {
                $('#videoTitle').hide();
            })
            Timer && clearInterval(Timer);
            videoTimer && clearInterval(videoTimer);
            Timer = setInterval(function () {
                var _currentTime = Math.floor(video_player.currentTime());
                if (_currentTime > hadCompleteTime) {
                    hadCompleteTime = _currentTime;
                }
                // console.log("大数据接口调用模拟");
                MiniCourse.dateSaveKafkaLog(_currentTime)
            }, 5000);
            videoTimer = setInterval(function () {
                var _currentTime2 = Math.floor(video_player.currentTime());
                // console.log("每30秒调用一次大连接口调用模拟",_currentTime2);
                MiniCourse.saveUserWatchVideo(_currentTime2);
            }, 30000)
        });
        that.on('pause', function () {
            // console.log("暂停");
            $('#VideoPlayer').off('mouseover').off('mouseout');
            $('#videoTitle').show();
            Timer && clearInterval(Timer);
            videoTimer && clearInterval(videoTimer);
        });
        that.on('ended', function () {
            // console.log("视频完成");
            Timer && clearInterval(Timer);
            videoTimer && clearInterval(videoTimer);
            MiniCourse.completeMiniVideo();
        })
    },
    /**
     * 保存用户续播时间
     * @param playTime 视频播放时间
     */
    saveUserWatchVideo:function (playTime) {
        var _token = $.getToken();
        var _taskId=$.getRequest('taskid');
        var _resId= $.getRequest('resid');
        var line='';
        $('#sourceList').children('li').each(function () {
            if($(this).hasClass('active')){
                line=$(this).attr('index');
            }
        });
		if( !line ){
			line = _resId > 0 ? 3:9;
		}
        $.ajax({
            url: BASE_API_URL + '/api-service-course/tpres/user/video/log?r=' + Math.random(),
            data: {
                line:line,
                playTime:playTime,
                taskId:_taskId,
                resId:_resId
            },
            type: 'POST',
            dataType: 'JSON',
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', _token);
            },
            success: function (res) {
                // console.log('保存用户续播时间)',res);
                hadCompleteTime=playTime;
            },
            error: function (err) {
                //console.log('保存用户续播时间error:', err);
				$.getErrorMsg(e, "保存用户续播时间");
            }
        });
    },
    //音频播放
    AudioPlay: function () {
        $('.audio').off('click').on('click', function () {
            var $audio = $(this).find('audio').get(0);
            var $this = $(this);
            if ($audio.paused) {
                $audio.play();
                $this.find('.overed').addClass('hidden');
                $this.find('.playing').removeClass('hidden');
            } else {
                $audio.pause();
                $this.find('.playing').addClass('hidden');
                $this.find('.overed').removeClass('hidden');
            }
            $audio.addEventListener('ended', function () {
                $this.find('.playing').addClass('hidden');
                $this.find('.overed').removeClass('hidden');
            }, false);
        });
    }
};
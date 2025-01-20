(function ($) {
    // 获取H标签 Obtenga la etiqueta H
    $("#article-content").children().each(function (index, element) {
        var tagName = $(this).get(0).tagName;
        if (tagName.substr(0, 1).toUpperCase() == "H") {
            var substrTagName = tagName.substr(1, 1);
            var dis = HContentPaddingLeft(substrTagName);
            var tagContent = $(this).text(); //获取内容 obtener el contenido
            if (tagContent != '') {
                var navId = "navegador-" + tagName + "-" + index.toString();

                $(this).attr("id", navId); //为当前h标签设置id Establecer para la etiqueta h actual
                editado = tagName == "H1" ? "font-weight:bold; background-color: #1a2332; font-size: 15px; " : "";
                editado2 = tagName == "H2" ? "background-color: #212a39; font-size: 14px; " : "";

                $(".right-navegador").append("<li style='margin-left: " + dis + "px; border-left: solid 1px #a4b1cd;' class='item " + navId + "'><a class='rtrt' style='padding-left: 5px; text-decoration:none; " + editado + editado2+"' href='#" + navId + "'>" + tagContent + "</a></li>").show(); //在目标DIV中添加内容 Agregar contenido en el DIV de destino
            }
        }
    });




    // 滚动 Desplazarse
    var header_wrap = 70; //$("#header").outerHeight() + -50 ; //头部的距离 distancia de la cabeza

    console.log(header_wrap)
    var rightNav = $("#right-navegador-box");
    $('#hDetallePri').on('scroll', function () {
        var cur_pos = 70; //$(this).scrollTop();
        console.log("Test " + cur_pos);
        $(":header").each(function () {
            var top = $(this).offset().top - header_wrap,
                bottom = top + $(this).outerHeight();
            if (cur_pos >= top && cur_pos <= bottom) {
                rightNav.find('li').removeClass('active');
                rightNav.find('a[href="#' + $(this).attr('id') + '"]').parent("li").addClass('active');
            }
        });
    });
    // 添加active
    $(".right-navegador li [href!='#']").click(function () {
        var var_href = $(this).attr("href");
        $('.active').removeClass('active');
        $(this).parent('li').addClass('active');
    });
    // 设置padding
    function HContentPaddingLeft(tagName) {
        switch (tagName) {
            case "2":
                tagName = "20";
                break;
            case "3":
                tagName = "40";
                break;
            case "4":
                tagName = "60";
                break;
            case "5":
                tagName = "70";
                break;
            case "6":
                tagName = "80";
                break;
            case "7":
                tagName = "90";
                break;
            default:
                tagName = "5";
        }
        return tagName;
    }
})(jQuery);

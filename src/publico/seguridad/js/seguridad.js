let host = "http://hack_tool:7777";
let autocompleteServi;
let autocomplete;

$(document).ready(function () {

    fetch(host + "/api/seguridad_def/titulos")
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            let titulosSubtitulos = JSON.parse(data);
            if (titulosSubtitulos == "") {
                console.log("No hay data");
            } else {
                var nuevoArray = []
                var arrayTemporal = []
                for (var i = 0; i < titulosSubtitulos.length; i++) {
                    arrayTemporal = nuevoArray.filter(resp => resp["Titulo"] == titulosSubtitulos[i]["NombrePrin"])
                    if (arrayTemporal.length > 0) {
                        nuevoArray[nuevoArray.indexOf(arrayTemporal[0])]["Subtitulos"].push({
                            "Subtitulo": titulosSubtitulos[i]["NombreSecu"],
                            "IdSubtitulo": titulosSubtitulos[i]["IdSecu"],
                            "Orden": titulosSubtitulos[i]["OrdenSecu"]
                        })

                    } else {
                        nuevoArray.push({
                            "Titulo": titulosSubtitulos[i]["NombrePrin"],
                            "IdTitulo": titulosSubtitulos[i]["IdPrin"],
                            "Subtitulos": [{
                                "Subtitulo": titulosSubtitulos[i]["NombreSecu"],
                                "IdSubtitulo": titulosSubtitulos[i]["IdSecu"],
                                "Orden": titulosSubtitulos[i]["OrdenSecu"]
                             }]
                        })
                    }
                }

                let tituloTem = "";
                let html1 = "";
                nuevoArray.forEach(function (data, index) {

                    let html2 = "";
                    data.Subtitulos.forEach(function (data2, index) {


                        html2 += `<a name="tituloSec" id=${"SEC"+data2.IdSubtitulo} >${data2.Orden}- ${data2.Subtitulo}</a>`;

                    });
                    html1 += `<button name="tituloPri" id=${"PRI"+data.IdTitulo} class="dropdown-btn">${data.Titulo}
                                    <i class="fa fa-caret-down"></i>
                                </button>
                                <div class="dropdown-container">
                                    ${html2}                                                    
                                </div>`;
                });

                document.getElementById("titulosSubtitulos").innerHTML += `${html1}`;

                /* Loop through all dropdown buttons to toggle between hiding and showing its dropdown content - This allows the user to have multiple dropdowns without any conflict */
                var dropdown = document.getElementsByClassName("dropdown-btn");
                var i;

                for (i = 0; i < dropdown.length; i++) {
                    dropdown[i].addEventListener("click", function () {
                        this.classList.toggle("active");
                        var dropdownContent = this.nextElementSibling;
                        if (dropdownContent.style.display === "block") {
                            dropdownContent.style.display = "none";
                        } else {
                            dropdownContent.style.display = "block";
                        }
                    });
                }
            }

            $('.dropdown-btn').dblclick(function () {
                let id = $(this).attr('id').slice(3);
                fetch(host + "/api/seguridad_def/principal/" + id)
                    .then(function (response) {
                        return response.text();
                    })
                    .then(function (data) {
                        let datos = JSON.parse(data);
                        $("#hIdPri").html("PRI" + datos.IdPrin);
                        $("#hNombrePri").html(datos.NombrePrin);
                        $("#hTipoPri").html(datos.TipoPrin);
                        //$("#hDetallePri").html(datos.DetallePri);
                        document.getElementById("hDetallePri").innerHTML = datos.DetallePrin;
                        //$('#hEnlaceIntPri').html(datos.EnlaceIntPri);
                    });
            });

            $('[name=tituloSec]').click(function () {
                let id = $(this).attr('id').slice(3);

                $('a').removeClass("active2");
                $(this).addClass("active2");

                mostrarSecundario(id)
            });
        })




    $('#mDetallePri').summernote({
        focus: true,
        // placeholder: '',
        //backColor: 'red', 
        handlebarsAutocomplete: {
            getSuggestions: (value) => {
                const suggestions = autocomplete;
                return suggestions.filter(suggestion => {
                    return suggestion.display.includes(value);
                });
            }
        },
        pentestAutocomplete: {
            getSuggestions: (value) => {
                const suggestions = autocompleteServi;
                return suggestions.filter(suggestion => {
                    return suggestion.display.includes(value);
                });
            }
        },
        blockquoteBreakingLevel: 2,
        codemirror: { // codemirror options
            mode: "htmlmixed",
            matchBrackets: true,
            htmlMode: true,
            lineNumbers: true,
            lineWrapping: true,
            styleActiveLine: true,
            smartIndent: true,
        },
        //tabDisable: true,
        styleTags: ['p',
        "code", 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        tabsize: 2,
        //lang: 'ko-KR',
        height: 795,
        toolbar: [['miAyuda', ['bto_Herra_Uni', 'bto_Servi_Uni']], ['miBoton', ['botonConcepto', 'botonDetalleTabla']], ['miBoton0', ['botonPoweShell', 'boPsShellPerso', 'boCmdPerso']], ['miBoton1', ['kali', 'botonKali_Res']], ['miBoton3', ['targetLin', 'targetWin']], ['miBoton4', ['reqResLin', 'botonTarget_R_root', 'reqResWin']], ['miBoton5', ['botonVim', 'botonJS', 'botonPhp', 'botonHtml', 'botonPlSql', 'botonHttp', 'botonXml']], ['miBoton6', ['botonPython', 'botonJava', 'botonBash', 'botonMarkup', 'botonAtom', 'botonFtp', 'botonMysql', 'botonMSF']], ['style', ['irA']], ['font', ['style', 'bold', 'italic', 'underline', 'botonParrafo', 'clear', 'add-text-tags', 'superscript', 'subscript']], ['color', ['color']], ['para', ['ul', 'ol', 'paragraph']], ['table', ['table']], ['insert', ['link', 'picture', 'iframe', 'botonShellLi', 'boKali_Res_Lit', 'botonTablaUni']], ['view', ['fullscreen', 'codeview', 'help']]],
        buttons: {
            bto_Herra_Uni,
            bto_Servi_Uni,
            kali: botonKali,
            irA: botonIrA,
            reqResLin: botonTarget_S_R_Lin,
            botonTarget_R_root,
            reqResWin: botonTarget_S_R_Win,
            targetLin: botonTargetLin,
            targetWin: botonTargetWin,
            botonVim,
            botonJS,
            botonPhp,
            botonHtml,
            botonPlSql,
            botonHttp,
            botonPython,
            botonXml,
            botonJava,
            botonMarkup,
            botonAtom,
            botonKali_Res,
            botonBash,
            botonFtp,
            botonMysql,
            botonParrafo,
            botonConcepto,
            botonMSF,
            botonHola,
            botonDetalleTabla,
            botonTablaUni,
            botonTituloPrima,
            botonPoweShell,
            botonShellLi,
            boKali_Res_Lit,
            boPsShellPerso,
            boCmdPerso
        },
        callbacks: {
            onImageUpload: function (files) {
                let id = $("#hIdPri").html().slice(3);
                if (id > 0) {
                    let selector = ($('#hIdPri').html()).slice(0, 3);
                    let nombreIma = selector + "." + id;
                    var imageData = new FormData();
                    imageData.append("imageData", files[0]);
                    imageData.append("lana", nombreIma);
                    $.ajax({
                        data: imageData,
                        type: "POST",
                        url: "http://hack_tool:7777/seguridad_def/imagen/" + nombreIma,
                        cache: false,
                        contentType: false,
                        processData: false,
                        success: function (result) {
                            if (result.status = "success") {
                                let imgNode = document.createElement("img");
                                //Lea la URL de la imagen devuelta desde el fondo
                                imgNode.src = result.imageUrl;
                                $('#mDetallePri').summernote('insertNode', imgNode);
                            }
                        },
                        error: function () {
                            console.log("No se pudo cargar la imagen");
                        }
                    });
                } else {
                    Swal.fire("Selecione una Metodología", "", "warning");
                }
            }
        },
        popover: {
            table: [
        ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
        ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
        ['custom', ['tableHeaders']]],
        }
    });

    $('#mEnlaceIntPri').summernote({
        codemirror: { // codemirror options
            focus: false,
            mode: "htmlmixed",
            //matchBrackets: true,
            htmlMode: true,
            lineNumbers: true,
            lineWrapping: true
        },
        tabsize: 2,
        // prettifyHtml: false,
        dialogsInBody: true,
        // tabDisable: true,
        height: 200,
        toolbar: [['mybutton', ['botonEnlacePri', 'enlace', 'subEnlace']], ['style', ['style']], ['font', ['bold', 'clear']], ['color', ['color']], ['view', ['fullscreen', 'codeview']]],
        buttons: {
            enlace: botonEnlace,
            subEnlace: botonSubEnlace,
            botonEnlaceCua,
            botonSubEnlaceCua,
            botonEnlacePri
        }
    });


});

//Relleno Para edición
let option;
$(document).on("click", "#btnEditar", function () {
    let selector = ($('#hIdPri').html()).slice(0, 3);

    if (selector == "PRI") {
        opcion = "editar";
        $("#formMetodologia").trigger("reset");
        $('#mDetallePri').summernote("code", "");
        $('#mEnlaceIntPri').summernote("code", "");

        let id = $("#hIdPri").html().slice(3);

        if (id >= 0) {

            $("#cabeceraPentest").css("background-color", "#3a4454");
            $("#cabeceraPentest").css("color", "white");
            $("#tituloPentest").text("Editar Seguridad Principal");
            $("#modalEditar").modal("show");

            fetch(host + "/api/seguridad_def/principal/" + id)
                .then(function (response) {
                    return response.text();
                })
                .then(function (data) {
                    let datos = JSON.parse(data);
                    $('#mIdPri').val(datos.IdPrin);
                    $('#mNombrePri').val(datos.NombrePrin);
                    $('#mTipoPri').val(datos.TipoPrin);
                    $('#mDetallePri').summernote("editor.pasteHTML", datos.DetallePrin);
                    $('#mNotaPri').val(datos.NotaPrin);

                });
        } else {
            Swal.fire('Seleccione una metodología');
        }

    } else if (selector == "SEC") {

        opcion = "editar";
        $("#formMetodologia").trigger("reset");
        $('#mDetallePri').summernote("code", "");
        $('#mEnlaceIntPri').summernote("code", "");

        let id = $("#hIdPri").html().slice(3);

        if (id >= 0) {

            $("#cabeceraPentest").css("background-color", "#3a4454");
            $("#cabeceraPentest").css("color", "white");
            $("#tituloPentest").text("Editar Seguridad Secundario");
            $("#modalEditar").modal("show");

            fetch(host + "/api/seguridad_def/secundario/" + id)
                .then(function (response) {
                    return response.text();
                })
                .then(function (data) {
                    let datos = JSON.parse(data);
                    $('#mIdPri').val(datos.IdSecu);
                    $('#mOrdenPri').val(datos.OrdenSecu);
                    $('#mNombrePri').val(datos.NombreSecu);
                    $('#mTipoPri').val(datos.TipoSecu);
                    $('#mNotaPri').val(datos.NotaSecu);
                    $('#mDetallePri').summernote("editor.pasteHTML", datos.DetalleSecu);

                });
        } else {
            Swal.fire('Seleccione una metodología');
        }
    } else {
        Swal.fire('Seleccione una metodología Válida');
    }
});

//submit para el CREAR y EDITAR
$("#formMetodologia").submit(function (e) {

    e.preventDefault();
    let selector = ($('#hIdPri').html()).slice(0, 3);
    if (selector == "PRI") {

        let IdPrin = $("#mIdPri").val();
        let DetallePrin = $("#mDetallePri").summernote('code');
        let NombrePrin = $("#mNombrePri").val();
        let TipoPrin = $("#mTipoPri option:selected").val();
        let NotaPrin = $("#mNotaPri").val();

        $.ajax({
            url: host + "/api/seguridad_def/add/principal",
            method: "put",
            contentType: "application/json",
            data: JSON.stringify({
                IdPrin,
                DetallePrin,
                NombrePrin,
                TipoPrin,
                NotaPrin
            }),
            success: function (data) {
                Swal.fire("¡Seguridad Principal Actualizada!", "", "success");
            },
        });

        $("#modalEditar").modal("hide");

    } else if (selector == "SEC") {
        let IdSecu = $('#mIdPri').val();
        let NombreSecu = $('#mNombrePri').val();
        let TipoSecu = $('#mTipoPri option:selected').val();
        let OrdenSecu = $('#mOrdenPri').val();
        let DetalleSecu = $('#mDetallePri').summernote('code');
        let NotaSecu = $('#mNotaPri').val();

        $.ajax({
            url: host + "/api/seguridad_def/add/secundario",
            method: "put",
            contentType: "application/json",
            data: JSON.stringify({
                IdSecu,
                NombreSecu,
                TipoSecu,
                OrdenSecu,
                DetalleSecu,
                NotaSecu
            }),
            success: function (data) {
                Swal.fire("¡Metodología Secundario Actualizada!", "", "");
            }
        });

        $("#modalEditar").modal("hide");
        refrescar(IdSecu)
    }
});


function refrescar(Id) {
    setTimeout(function () {
        mostrarSecundario(Id);
    }, 1000);
}

//Mostrar Pentesting

function mostrarSecundario(IdSecu) {
    fetch(host + "/api/seguridad_def/secundario/" + IdSecu)
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            $('#hEnlaceIntPri').html('<ul class="right-navegador" id="right-navegador-box"></ul>');
            let datos = JSON.parse(data);
            $("#hIdPri").html("SEC" + datos.IdSecu);
            $("#hNombrePri").html(datos.NombreSecu);
            $("#hTipoPri").html(datos.TipoSecu);
            $("#hDetallePri").html('<header id="header"><hr></header><div id="article-content" class="markdown-body">' + datos.DetalleSecu + '</div>');

            reloadJs("./pentest/prism/prism.js");
            reloadJs("./pentest/js/menu_resaltado.js");
            console.log("Mostrar Herra");


            $('.botonHerramienta').click(function () {
                let value = (this.id).split('_');
                let id = value[0]

                mostrarHerraUnico(id)
                reloadJs("./pentest/prism/prism.js");

            });

            $('.botonServicio').click(function () {
                let value = (this.id).split('_');
                let id = value[0]

                mostrarServiUnico(id)
                reloadJs("./pentest/prism/prism.js");
            });
        });
}

function reloadJs(src) {
    src = $('script[src$="' + src + '"]').attr("src");
    $('script[src$="' + src + '"]').remove();
    $('<script/>').attr('src', src).appendTo('head');
}

/*====================buscar====================*/

$("#buscarEnlace").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    jQuery("#hEnlaceIntPri *").filter(function () {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1).css('color', '#AD5D4E')
    });
});

$("#buscarDetalle").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    jQuery("#hDetallePri *").filter(function () {
        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
    });
});


$("#modoLectura").click(function () {
    let tapaM = document.getElementById("menuPrincipal");
    let tapaD = document.getElementById("hEnlaceIntPri");
    let tapaI = document.getElementById("titulosSubtitulos");
    let color = document.getElementById("hDetallePri");

    if (tapaM.style.display === "none") {
        tapaM.style.display = "block";
    } else {
        tapaM.style.display = "none";
    }

    if (tapaD.style.display === "none") {
        tapaD.style.display = "block";
    } else {
        tapaD.style.display = "none";
    }

    if (tapaI.style.display === "none") {
        tapaI.style.display = "block";
    } else {
        tapaI.style.display = "none";
    }

    if (tapaD.style.display === "block") {
        color.style.color = "#a4b1cd";
    } else {
        color.style.color = "#a4b1cd";
    }
});
//

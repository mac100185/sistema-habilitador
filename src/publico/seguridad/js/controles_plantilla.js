// Configuración centralizada - usar window.host o APP_CONFIG
// La variable host se obtiene de config.js
let opcion = null;
let fila = null;
let controlesSe = null;
$(document).ready(function () {
  renderDatatable("all");

  $("#mCModelo_Evidencia").summernote({
    handlebarsAutocomplete: {
      getSuggestions: (value) => {
        const suggestions = autocomplete;
        return suggestions.filter((suggestion) => {
          return suggestion.display.includes(value);
        });
      },
    },

    //blockquoteBreakingLevel: 0,
    codemirror: {
      // codemirror options
      mode: "htmlmixed",
      htmlMode: true,
      lineNumbers: true,
      lineWrapping: true,
    },
    //tabDisable: true,
    styleTags: ["p", "code", "h1", "h2", "h3", "h4", "h5", "h6"],
    tabsize: 2,
    //lang: 'ko-KR',
    height: 795,
    toolbar: [
      ["miAyuda", ["bto_Herra_Uni", "bto_Servi_Uni"]],
      ["miBoton", ["botonConcepto", "botonDetalleTabla"]],
      ["miBoton0", ["botonPoweShell", "boPsShellPerso", "boCmdPerso"]],
      ["miBoton1", ["kali", "botonKali_Res"]],
      ["miBoton3", ["targetLin", "targetWin"]],
      ["miBoton4", ["reqResLin", "botonTarget_R_root", "reqResWin"]],
      [
        "miBoton5",
        [
          "botonVim",
          "botonJS",
          "botonPhp",
          "botonHtml",
          "botonPlSql",
          "botonHttp",
          "botonXml",
        ],
      ],
      [
        "miBoton6",
        [
          "botonPython",
          "botonJava",
          "botonBash",
          "botonMarkup",
          "botonAtom",
          "botonFtp",
          "botonMysql",
          "botonMSF",
        ],
      ],
      ["style", ["irA"]],
      [
        "font",
        [
          "style",
          "bold",
          "italic",
          "underline",
          "botonParrafo",
          "clear",
          "add-text-tags",
          "superscript",
          "subscript",
        ],
      ],
      ["color", ["color"]],
      ["para", ["ul", "ol", "paragraph"]],
      ["table", ["table"]],
      [
        "insert",
        [
          "link",
          "picture",
          "iframe",
          "botonShellLi",
          "boKali_Res_Lit",
          "botonTablaUni",
        ],
      ],
      ["view", ["fullscreen", "codeview", "help"]],
    ],
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
      boCmdPerso,
    },
    callbacks: {
      onImageUpload: function (files) {
        let id = $("#mCId").val();
        if (id > 0) {
          let nombreIma = "SEG_CON_" + id;
          var imageData = new FormData();
          imageData.append("imageData", files[0]);
          imageData.append("lana", nombreIma);
          $.ajax({
            data: imageData,
            type: "POST",
            url:
              (window.APP_CONFIG ? window.APP_CONFIG.API_HOST : window.host) +
              "/seguridad_def/imagen/" +
              nombreIma,
            cache: false,
            contentType: false,
            processData: false,
            success: function (result) {
              if ((result.status = "success")) {
                let imgNode = document.createElement("img");
                //Lea la URL de la imagen devuelta desde el fondo
                imgNode.src = result.imageUrl;
                $("#mCModelo_Evidencia").summernote("insertNode", imgNode);
              }
            },
            error: function () {
              console.log("No se pudo cargar la imagen");
            },
          });
        } else {
          Swal.fire("Selecione un Control", "", "warning");
        }
      },
    },
    popover: {
      table: [
        ["add", ["addRowDown", "addRowUp", "addColLeft", "addColRight"]],
        ["delete", ["deleteRow", "deleteCol", "deleteTable"]],
        ["custom", ["tableHeaders"]],
      ],
    },
  });

  $("#mCNombre").summernote({
    width: "100%",
    codemirror: {
      // codemirror options
      mode: "htmlmixed",
      //matchBrackets: true,
      htmlMode: true,
      lineNumbers: true,
      lineWrapping: true,
    },
    tabsize: 2,
    height: 300,
    toolbar: [
      ["style", ["style"]],
      ["font", ["bold", "underline", "clear"]],
      ["color", ["color"]],
      ["para", ["ul", "ol", "paragraph"]],
      ["view", ["fullscreen", "codeview"]],
    ],
  });

  $("#mCAcciones_Comenta").summernote({
    width: "100%",
    codemirror: {
      // codemirror options
      mode: "htmlmixed",
      htmlMode: true,
      lineNumbers: true,
      lineWrapping: true,
    },
    tabsize: 2,
    height: 300,
    toolbar: [
      ["style", ["style"]],
      ["font", ["bold", "underline", "clear"]],
      ["color", ["color"]],
      ["para", ["ul", "ol", "paragraph"]],
      ["view", ["fullscreen", "codeview"]],
    ],
  });

  //EDITAR - Relleno de Cajas de texto
  $(document).on("click", ".btnEditar", function () {
    opcion = "editar";
    fila = $(this).closest("tr");
    let IdControl = parseInt(fila.find("td:eq(0)").text());
    $("#formComando").trigger("reset");
    $("#mCNombre").summernote("code", "");
    $("#mCCriterios_Cumpli").summernote("code", "");
    $("#mCAcciones_Comenta").summernote("code", "");
    $("#mCModelo_Evidencia").summernote("code", "");
    fetch(host + "/api/seguridad_def/controles/unico/" + IdControl)
      .then(function (response) {
        return response.text();
      })
      .then(function (data) {
        let datos = JSON.parse(data);
        $("#mCId").val(datos.Id);
        $("#mCDimension").val(datos.Dimension);
        $("#mCDominio").val(datos.Dominio);
        $("#mCTitulo").val(datos.Titulo);
        $("#mCNombre").summernote("editor.pasteHTML", datos.Nombre);
        $("#mCCriterios_Cumpli").summernote(
          "editor.pasteHTML",
          datos.Criterios_Cumpli,
        );
        $("#mCAcciones_Comenta").summernote(
          "editor.pasteHTML",
          datos.Acciones_Comenta,
        );
        $("#mCCambios").val(datos.Cambios);
        $("#mCImprescindible").val(datos.Imprescindible);
        $("#mCPaquete").val(datos.Paquete);
        $("#mCCumplimiento").val(datos.Cumplimiento);
        $("#mCComentarios").val(datos.Comentarios);
        $("#mCResponsable").val(datos.Responsable);
        $("#mCCaptura_Ambiente").val(datos.Captura_Ambiente);
        $("#mCEtapa_Evidencia").val(datos.Etapa_Evidencia);
        $("#mCLineamiento").val(datos.Lineamiento);
        $("#mCEntregables").val(datos.Entregables);
        $("#mCModelo_Evidencia").summernote(
          "editor.pasteHTML",
          datos.Modelo_Evidencia,
        );
        $("#mCPendiente").val(datos.Pendiente);
        $("#mCEstado").val(datos.Estado);
        $("#mCComen_Analis").val(datos.Comen_Analis);
      });
    //$(".modal-header").css("background-color", "#065A82");
    //$(".modal-header").css("color", "white");
    $(".modal-title").text("Editar Control");
    $("#modalComando").modal("show");
  });

  //submit para el CREAR y EDITAR
  $("#formComando").submit(function (e) {
    e.preventDefault();
    let Id = $("#mCId").val();
    let Dimension = $("#mCDimension").val();
    let Dominio = $("#mCDominio").val();
    let Titulo = $("#mCTitulo").val();
    let Nombre = $("#mCNombre").summernote("code");
    let Criterios_Cumpli = $("#mCCriterios_Cumpli").summernote("code");
    let Acciones_Comenta = $("#mCAcciones_Comenta").summernote("code");
    let Cambios = $("#mCCambios").val();
    let Imprescindible = $("#mCImprescindible").val();
    let Paquete = $("#mCPaquete").val();
    let Cumplimiento = $("#mCCumplimiento").val();
    let Comentarios = $("#mCComentarios").val();
    let Responsable = $("#mCResponsable").val();
    let Captura_Ambiente = $("#mCCaptura_Ambiente").val();
    let Etapa_Evidencia = $("#mCEtapa_Evidencia").val();
    let Lineamiento = $("#mCLineamiento").val();
    let Entregables = $("#mCEntregables").val();
    let Modelo_Evidencia = $("#mCModelo_Evidencia").summernote("code");
    let Pendiente = $("#mCPendiente").val();
    let Estado = $("#mCEstado").val();
    let Comen_Analis = $("#mCComen_Analis").val();
    if (opcion == "crear") {
      $.ajax({
        url: host + "/api/seguridad_def/controles/",
        method: "post",
        contentType: "application/json",
        data: JSON.stringify({
          Dimension,
          Dominio,
          Nombre,
          Titulo,
          Criterios_Cumpli,
          Acciones_Comenta,
          Cambios,
          Imprescindible,
          Paquete,
          Cumplimiento,
          Comentarios,
          Responsable,
          Captura_Ambiente,
          Etapa_Evidencia,
          Lineamiento,
          Entregables,
          Modelo_Evidencia,
          Pendiente,
          Estado,
          Comen_Analis,
        }),
        success: function (data) {
          Swal.fire("¡Control Agregado!", "", "success");
          tablaComando.ajax.reload(null, false);
          mostrarControles(Id);
        },
      });
    }

    if (opcion == "editar") {
      $.ajax({
        url: host + "/api/seguridad_def/controles/up",
        method: "put",
        contentType: "application/json",
        data: JSON.stringify({
          Id,
          Dimension,
          Dominio,
          Nombre,
          Titulo,
          Criterios_Cumpli,
          Acciones_Comenta,
          Cambios,
          Imprescindible,
          Paquete,
          Cumplimiento,
          Comentarios,
          Responsable,
          Captura_Ambiente,
          Etapa_Evidencia,
          Lineamiento,
          Entregables,
          Modelo_Evidencia,
          Pendiente,
          Estado,
          Comen_Analis,
        }),

        success: function (data) {
          Swal.fire("¡Control Actualizado!", "", "success");

          mostrarControles(Id);

          if (controlesSe == null) {
            renderDatatable("all");
          } else {
            renderDatatable(controlesSe);
          }
          //tablaComando.ajax.reload(null, false);
        },
      });
    }
    $("#modalComando").modal("hide");
  });

  //Mostrar Detalles
  $(document).on("click", ".btnMostrarCon", function () {
    fila = $(this).closest("tr");
    let IdComando = parseInt(fila.find("td:eq(0)").text());
    //Mostrar
    console.log(IdComando);
    mostrarControles(IdComando);
  });
});

function mostrarControles(id) {
  fetch(host + "/api/seguridad_def/controles/unico/" + id)
    .then(function (response) {
      return response.json();
    })
    .then(function (datos) {
      $("#hCId").html(datos.Id);
      $("#hCDimension").html(datos.Dimension);
      $("#hCDominio").html(datos.Dominio);
      $("#hCTitulo").html(datos.Titulo);
      $("#hCNombre").html(datos.Nombre);
      $("#hCCriterios_Cumpli").html(datos.Criterios_Cumpli);
      $("#hCAcciones_Comenta").html(datos.Acciones_Comenta);

      if (datos.Acciones_Comenta.length > 2) {
        $("#comentariosRender").html(
          `<div class="tituloContr" style="font-size: 14px;">Comentarios</div><div class="detalleContr">${datos.Acciones_Comenta}</div>`,
        );
      } else {
        $("#comentariosRender").html("");
      }

      if (datos.Cambios.length > 2) {
        $("#cambiosRender").html(
          `<div class="tituloContr" style="font-size: 14px;">Cambios</div><div class="detalleContr">${datos.Cambios}</div>`,
        );
      } else {
        $("#cambiosRender").html("");
      }
      let imprecin;
      jQuery(function ($) {
        if (datos.Imprescindible == "SI") {
          imprecin = "ED1C25";
        } else {
          imprecin = "7AB929";
        }

        $("svg").each(function () {
          $(this)
            .find(".z")
            .css({
              fill: "#" + imprecin,
            });
        });
      });

      $("#hCPaquete").html(datos.Paquete);
      $("#hCCumplimiento").html(datos.Cumplimiento);
      $("#hCComentarios").html(datos.Comentarios);
      $("#hCResponsable").html(datos.Responsable);
      $("#hCCaptura_Ambiente").html(datos.Captura_Ambiente);
      $("#hCEtapa_Evidencia").html(datos.Etapa_Evidencia);
      $("#hCLineamiento").html(datos.Lineamiento);

      if (datos.Lineamiento.length > 2) {
        $("#lineamientoRender").html(
          `<div class="tituloContr" style="font-size: 14px;">Lineamiento</div><div class="detalleContr">${datos.Lineamiento}</div>`,
        );
      } else {
        $("#lineamientoRender").html("");
      }

      $("#hCEntregables").html(datos.Entregables);
      $("#hCModelo_Evidencia").html(datos.Modelo_Evidencia);
      $("#hCPendiente").html(datos.Pendiente);
      $("#hCEstado").html(datos.Estado);
      $("#hCComen_Analis").html(datos.Comen_Analis);

      let Donde = JSON.parse(datos.Captura_Donde);
      let inicio, certi, prod, textoInicio, textoCerti, textoProd;

      jQuery(function ($) {
        //----------------

        if (Donde[0] == 1) {
          inicio = "7AB929";
          textoInicio = "a4b1cd";
        } else {
          inicio = "303030";
          textoInicio = "303030";
        }
        //--------------------

        if (Donde[1] == 1) {
          certi = "FFD200";
          textoCerti = "a4b1cd";
        } else {
          certi = "303030";
          textoCerti = "303030";
        }
        //------------------

        if (Donde[2] == 1) {
          prod = "ED1C25";
          textoProd = "a4b1cd";
        } else {
          prod = "303030";
          textoProd = "303030";
        }
        // Load patterns
        $("svg").each(function () {
          $(this)
            .find(".h")
            .css({
              fill: "#" + inicio,
            });
          $(this)
            .find(".i")
            .css({
              fill: "#" + certi,
            });
          $(this)
            .find(".k")
            .css({
              fill: "#" + prod,
            });

          $(this)
            .find(".textoDondeIn")
            .css({
              fill: "#" + textoInicio,
            });
          $(this)
            .find(".textoDondeCe")
            .css({
              fill: "#" + textoCerti,
            });
          $(this)
            .find(".textoDondePr")
            .css({
              fill: "#" + textoProd,
            });
        });
      });

      reloadJs("./pentest/prism/prism.js");
      reloadJs("./pentest/js/menu_resaltado.js");
    });
}

function reloadJs(src) {
  src = $('script[src$="' + src + '"]').attr("src");
  $('script[src$="' + src + '"]').remove();
  $("<script/>").attr("src", src).appendTo("head");
}
/*=======Pantalla Completa=============*/

$("#buscarDetalle").on("keyup", function () {
  var value = $(this).val().toLowerCase();
  jQuery("#hHEDetalleHerra *").filter(function () {
    $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
  });
});

$("#seleccionarComando").click(function () {
  var checkboxes = document.querySelectorAll("input[name=selectControl]");
  var checked = [];
  for (var i = 0; i < checkboxes.length; i++) {
    var checkbox = checkboxes[i];
    if (checkbox.checked) checked.push(checkbox.value);
  }
  let text = checked.toString();
  controlesSe = text;
  renderDatatable(controlesSe);
});

function renderDatatable(id) {
  //Para solucionar scroll header
  $('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
    $.fn.dataTable
      .tables({
        visible: true,
        api: true,
      })
      .columns.adjust();
  });
  //----------------------------------------------------------------------
  //MOSTRAR en DataTables
  let tablaComando = $("#tablaComando").DataTable({
    // destroy: true, // para inicializar actualizar
    paging: false,
    scrollCollapse: true,
    scrollY: "710px",
    ajax: {
      url: host + "/api/seguridad_def/controles/" + id, //se concatena la pagina
      dataSrc: "",
    },
    columns: [
      {
        data: "Id",
        width: "5%",
        orderable: false,
        render: function (data) {
          data = `<div class="text-center">

                            <button class="button_edit btnEditar" style="padding: 0; height:26px;width: 26px;" title="Editar Control">
                                ${data}
                            </button>

                    </div>`;
          return data;
        },
      },
      {
        data: "Titulo",
        width: "60%",
        render: function (data) {
          data = ` ${data}`;
          return (
            '<span class="btnMostrarCon" style="white-space:normal; width:200px !important;">' +
            data +
            "</span>"
          );
        },
      },
      {
        data: "Dominio",
        width: "35%",
        render: function (data) {
          data = ` ${data}`;
          return data;
        },
      },
    ],
    fixedColumns: true,
    // dom: 'Bfrtip',
    // Traducción
    language: {
      lengthMenu: "Mostrar _MENU_ registros",
      zeroRecords: "No se encontraron resultados",
      info: "Registros del _START_ al _END_ de un total de _TOTAL_ registros",
      infoEmpty: "Mostrando registros del 0 al 0 de un total de 0 registros",
      infoFiltered: "(filtrado de un total de _MAX_ registros)",
      sSearch: "Buscar:",
      oPaginate: {
        sFirst: "Primero",
        sLast: "Último",
        sNext: "Siguiente",
        sPrevious: "Anterior",
      },
      sProcessing: "Procesando...",
    },
  });
}

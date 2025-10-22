// Configuración centralizada - usar window.host o APP_CONFIG
// let opcion = null;
// let fila = null;
// let controlesSe = null;
$(document).ready(function () {
  renderDatatableHabi("0/All/Aplica");
  graficaHabil("0");
  graficaHabilImpre("0");
  fetch(host + "/api/seguridad_def/combo/squads", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + (localStorage.getItem("token") || ""),
    },
  })
    .then(function (response) {
      return response.text();
    })
    .then(function (data) {
      let vulnerabilidades = JSON.parse(data);

      if (vulnerabilidades == "") {
        console.log("No hay data");
      } else {
        $(vulnerabilidades).each(function () {
          let option = $(document.createElement("option"));

          option.text(this.NombrePrin);
          option.val(this.IdPrin);
          $("#squadHabi").append(option);
        });
      }
    })
    .catch(function (error) {
      console.error("Error al cargar squads:", error);
    });

  $("#squadHabi").on("change", function () {
    /*Limpiar combo*/
    let comboIniciativa = document.getElementById("Hab_iniciativa");
    comboIniciativa.innerHTML =
      '<option value="0">Seleccione una Iniciativa ...</option>';

    let cumplimien = document.getElementById("habiliCumpli");
    cumplimien.innerHTML = '<option value="0">Seleccione ...</option>';

    let squad = $("#squadHabi option:selected").val();

    $("#cumpSquad").html($("#squadHabi option:selected").text());

    if (squad == "0") {
      renderDatatableHabi("0/All/Aplica");
      graficaHabil("0");
      graficaHabilImpre("0");

      let iniciativa = document.getElementById("Hab_iniciativa");
      iniciativa.innerHTML =
        '<option value="0">Seleccione una Iniciativa ...</option>';
    } else {
      fetch(host + "/api/seguridad_def/combo/squads/iniciativa/" + squad, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (localStorage.getItem("token") || ""),
        },
      })
        .then(function (response) {
          return response.text();
        })
        .then(function (data) {
          let iniciativa_ = JSON.parse(data);
          let iniciaInf = document.getElementById("Hab_iniciativa");
          if (iniciativa_ == "") {
            iniciaInf.innerHTML =
              '<option value="0">Seleccione una Iniciativa ...</option>';
          } else {
            $(iniciativa_).each(function () {
              let option = $(document.createElement("option"));
              option.text(this.Nombre);
              option.val(this.Id);
              $("#Hab_iniciativa").append(option);
            });
          }
        })
        .catch(function (error) {
          console.error("Error al cargar iniciativas:", error);
        });
    }

    renderDatatableHabi("0/All/Aplica");
    graficaHabil("0");
    graficaHabilImpre("0");

    $("#cumpSquad").html($("#squadHabi option:selected").text());
    $("#cumpIniciativa").html($("#Hab_iniciativa option:selected").text());

    //Etapa
    $("#squadNomEtapa").val($("#squadHabi option:selected").text());
    $("#iniciativaEtapa").val($("#Hab_iniciativa option:selected").text());
  });

  $("#mCEvidenciaHabSquad").summernote({
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
    height: 625,
    toolbar: [
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
          "botSeguDefTab",
          "link",
          "picture",
          "iframe",
          "botonShellLi",
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
      botonDetalleTabla,
      botonTablaUni,
      botonTituloPrima,
      botonPoweShell,
      botonShellLi,
      boPsShellPerso,
      boCmdPerso,
      botSeguDefTab,
    },
    callbacks: {
      onImageUpload: function (files) {
        let id = $("#mCIdHab").val();
        let idSquad = $("#mCHabSquad").val();
        if (id > 0) {
          let nombreIma = "HAB_SEG_" + id + "_" + idSquad;
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
                $("#mCEvidenciaHabSquad").summernote("insertNode", imgNode);
              }
            },
            error: function () {
              console.log("No se pudo cargar la imagen");
            },
          });
        } else {
          Swal.fire("Selecione un Habilitador", "", "warning");
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

  /*=========Palntilla======================*/
  $(document).on("click", ".btnPlantillaHabi", function () {
    console.log("Test");
    let fila = $(this).closest("tr");
    let IdHabBase = parseInt(fila.find("td:eq(1)").text());
    let IdHabSquad = parseInt(fila.find("td:eq(0)").text());
    /*Squad*/

    fetch(
      host +
        "/api/seguridad_def/controles_squad/unitario/squad/uni/" +
        IdHabSquad,
    )
      .then(function (response) {
        return response.text();
      })
      .then(function (data) {
        let datos = JSON.parse(data);
        $("#PlhCHabSquad").html(datos.HabSquad);
        $("#PlhCObserHabSquad").html(datos.ObserHabSquad);
        $("#PlhCEstadoHabSquad").html(datos.EstadoHabSquad);
        $("#PlhCEvidenciaHabSquad").html(datos.EvidenciaHabSquad);
      });

    /*Base*/
    fetch(host + "/api/seguridad_def/controles/unico/" + IdHabBase, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (localStorage.getItem("token") || ""),
      },
    })
      .then(function (response) {
        return response.text();
      })
      .then(function (data) {
        let datos = JSON.parse(data);
        $("#PlhCDimension").html(datos.Dimension);
        $("#PlhCDominio").html(datos.Dominio);
        $("#PLhCTitulo").html(datos.Titulo);
        $("#PLhCNombre").html(datos.Nombre);
        $("#PlhCCriterios_Cumpli").html(datos.Criterios_Cumpli);
        $("#PlhCImprescindible").html(datos.Imprescindible);
      });

    //$(".modal-header").css("background-color", "#065A82");
    //$(".modal-header").css("color", "white");
    $(".modal-title").text("Evidencia");
    $("#plantillaHabi").modal("show");
  });

  //Agregar iniciativa
  $("#formAddIniciativa").submit(function (e) {
    e.preventDefault();
    let Nombre = $("#mAiNombre").val();
    let Tipo = $("#mAiTipo").val();
    let Nota = $("#mAiNota").val();
    let Id_Squad = $("#mAiId_Squad").val();

    $.ajax({
      url: host + "/api/seguridad_def/combo/squads/iniciativa/",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        Nombre,
        Tipo,
        Nota,
        Id_Squad,
      }),
      success: function (data) {
        //Para actualizar la tabla
        proyVulne.ajax.reload(null, false);
        Swal.fire("¡Se Agregó la Iniciativa!", "", "success");
      },
    });
    $("#modalAddIniciativa").modal("hide");
  });
});

function reloadJs(src) {
  src = $('script[src$="' + src + '"]').attr("src");
  $('script[src$="' + src + '"]').remove();
  $("<script/>").attr("src", src).appendTo("head");
}

function renderDatatableHabi(id) {
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
  let SquadProy = $("#squadHabi option:selected").text();
  let iniciativa = $("#Hab_iniciativa option:selected").text();

  const f = new Date();
  const formatDate = (d) => {
    return d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
  };
  let time = formatDate(f);
  //MOSTRAR en DataTables
  let tablaComando = $("#HabilitaSquad").DataTable({
    destroy: true, // para inicializar actualizar
    paging: false,
    scrollCollapse: true,
    scrollY: "660px",
    createdRow: function (row, data, index) {
      if (data["EstadoHabSquad"] == "No Cumple") {
        $("td", row).eq(3).css({
          "border-left": "5px outset #91243e",
        });
      } else if (data["EstadoHabSquad"] == "En Progreso") {
        $("td", row).eq(3).css({
          "border-left": "5px outset #CA6F1E",
        });
      } else if (data["EstadoHabSquad"] == "Si Cumple") {
        $("td", row).eq(3).css({
          "border-left": "5px outset #0c589d",
        });
      } else if (data["EstadoHabSquad"] == "Falta Evidencia") {
        $("td", row).eq(3).css({
          "border-left": "5px outset #606060",
        });
      } else if (data["EstadoHabSquad"] == "Con Observaciones") {
        $("td", row).eq(3).css({
          "border-left": "5px outset #ad5d4e",
        });
      } else if (data["EstadoHabSquad"] == "Cumple Parcial") {
        $("td", row).eq(3).css({
          "border-left": "5px outset #2471a3",
        });
      } else {
        $("td", row).eq(3).css({
          "border-left": "5px outset #404040",
        });
      }
    },
    ajax: {
      url: host + "/api/seguridad_def/controles_squad/" + id, //se concatena la pagina
      dataSrc: "",
    },
    columns: [
      {
        data: "IdHab",
        width: "2%",
        orderable: false,
        render: function (data) {
          data = `<div class="text-center">

                      <button class="button_edit btnEditarHabSquad"  style="padding: 0; height:26px;width: 26px;" title="Editar Habilitador Squad">
                                ${data}
                            </button>
                    </div>`;
          return data;
        },
      },
      {
        data: "HabSquad",
        width: "2%",
        className: "dt-body-center",
      },
      {
        data: "TituloHabSquad",
        width: "40%",
        render: function (data) {
          data = ` ${data}`;
          return (
            '<span class="btnMostrarCon btnPlantillaHabi" style="white-space:normal; width:200px !important;" title="Mostrar Formato y Evidencia">' +
            data +
            "</span>"
          );
        },
      },
      {
        data: "EstadoHabSquad",
        width: "20%",
        className: "dt-body-center",
      },
      {
        data: "ObserHabSquad",
        width: "35%",
      },
      {
        data: "EvidenciaHabSquad",
        width: "5%",
        render: function (data) {
          data = ` ${data}`;
          if (data.length > 5) {
            return "SI";
          } else {
            return "NO";
          }
        },
        className: "dt-body-center",
      },
      {
        data: "ImprescindibleSquad",
        width: "2%",
        className: "dt-body-center",
      },
    ],
    fixedColumns: true,

    //dom: 'Bfrtip',
    dom: "Bfrtip",
    buttons: {
      dom: {
        button: {
          className: "button-prin",
        },
      },
      buttons: [
        {
          //definimos estilos del boton de excel
          extend: "excel",
          text: "Exportar a Excel",
          className: "button-prin",
          exportOptions: {
            columns: [1, 2, 3, 4, 6],
            alignment: "center",
          },
          //messageTop: "Vulnerabilidades",
          filename:
            "Habilitadores de Seguridad Squad_" + SquadProy + "_" + time,
          title:
            "Habilitadores de Seguridad Squad: " +
            SquadProy +
            " Iniciativa: " +
            iniciativa,

          excelStyles: {
            // Add an excelStyles definition
            cells: "2", // columnas al cual afecta
            style: {
              // The style block
              font: {
                // Style the font
                name: "Arial", // Font name
                size: "10", // Font size
                color: "FFFFFF", // Font Color
                b: true, // Remove bolding from header row
              },
              fill: {
                // Style the cell fill (background)
                pattern: {
                  // Type of fill (pattern or gradient)
                  color: "457B9D", // Fill color
                },
              },
            },
          },
        },
      ],
    },
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
$("#actualizarHabiliSq").on("click", function () {
  let IdHab = $("#mCIdHab").val();
  let EstadoHabSquad = $("#mCEstadoHabSquad").val();
  let ObserHabSquad = $("#mCObserHabSquad").val();
  let EvidenciaHabSquad = $("#mCEvidenciaHabSquad").summernote("code");
  $.ajax({
    url: host + "/api/seguridad_def/controles_squad/unico",
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify({
      IdHab,
      EstadoHabSquad,
      ObserHabSquad,
      EvidenciaHabSquad,
    }),
    success: function (data) {
      Swal.fire("¡Habilitador Actualizado!", "", "success");
      let idIniciativa = $("#Hab_iniciativa option:selected").val();
      let idInpreci = $("#habiliImpre option:selected").val();
      let idCumpli = $("#habiliCumpli option:selected").val();
      renderDatatableHabi(idIniciativa + "/" + idInpreci + "/" + idCumpli);
      //tablaComando.ajax.reload(null, false);
    },
  });

  $("#modalHabSquad").modal("hide");
});

/*Habilitadro Squad*/
$(document).on("click", ".btnEditarHabSquad", function () {
  console.log("Test");
  let fila = $(this).closest("tr");
  let IdControl = parseInt(fila.find("td:eq(0)").text());
  $("#formHabiliUnico").trigger("reset");
  $("#mCEvidenciaHabSquad").summernote("code", "");
  fetch(
    host + "/api/seguridad_def/controles_squad/unitario/squad/uni/" + IdControl,
  )
    .then(function (response) {
      return response.text();
    })
    .then(function (data) {
      let datos = JSON.parse(data);
      $("#mCIdHab").val(datos.IdHab);
      $("#mCHabSquad").val(datos.HabSquad);
      $("#mCTituloHabSquad").val(datos.TituloHabSquad);
      $("#mCEstadoHabSquad").val(datos.EstadoHabSquad);
      $("#mCObserHabSquad").val(datos.ObserHabSquad);
      $("#mCEvidenciaHabSquad").summernote(
        "editor.pasteHTML",
        datos.EvidenciaHabSquad,
      );
    });

  //$(".modal-header").css("background-color", "#065A82");
  //$(".modal-header").css("color", "white");
  $(".modal-title").text("Editar Habilitador");
  $("#modalHabSquad").modal("show");
});

$("#Hab_iniciativa").on("change", function () {
  let cumplimien = document.getElementById("habiliCumpli");
  cumplimien.innerHTML = '<option value="Aplica">Aplica</option>';

  let iniciativa = $("#Hab_iniciativa option:selected").val();

  if (iniciativa == "0") {
    // let iniciativa = document.getElementById('habiliCumpli')
    // vulnerabilidadInf.innerHTML = '<option value="0">Seleccione...</option>';
  } else {
    fetch(host + "/api/seguridad_def/combo/squads/cumplimiento/" + iniciativa, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (localStorage.getItem("token") || ""),
      },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        let iniciativa_ = data.reverse();
        let iniciaInf = document.getElementById("Hab_iniciativa");
        if (iniciativa_ == "") {
          iniciaInf.innerHTML = '<option value="0">Sellecione ...</option>';
        } else {
          $(iniciativa_).each(function () {
            let option = $(document.createElement("option"));
            option.text(this.Nombre);
            option.val(this.Nombre);
            $("#habiliCumpli").append(option);
          });
        }
      });
  }

  let idIniciativa = $("#Hab_iniciativa option:selected").val();
  let idInpreci = $("#habiliImpre option:selected").val();
  let idCumpli = $("#habiliCumpli option:selected").val();
  renderDatatableHabi(idIniciativa + "/" + idInpreci + "/" + idCumpli);
  graficaHabil(idIniciativa);
  graficaHabilImpre(idIniciativa);

  tablaGrafi(idIniciativa);

  //Etapa
  $("#squadNomEtapa").val($("#squadHabi option:selected").text());
  $("#iniciativaEtapa").val($("#Hab_iniciativa option:selected").text());
  svg_textMultiline();
});

$("#habiliImpre").on("change", function () {
  let idIniciativa = $("#Hab_iniciativa option:selected").val();
  let idInpreci = $("#habiliImpre option:selected").val();
  let idCumpli = $("#habiliCumpli option:selected").val();
  renderDatatableHabi(idIniciativa + "/" + idInpreci + "/" + idCumpli);
});

$("#habiliCumpli").on("change", function () {
  let idIniciativa = $("#Hab_iniciativa option:selected").val();
  let idInpreci = $("#habiliImpre option:selected").val();
  let idCumpli = $("#habiliCumpli option:selected").val();
  renderDatatableHabi(idIniciativa + "/" + idInpreci + "/" + idCumpli);
});

function selectElementContents(el) {
  let body = document.body,
    range,
    sel;
  if (document.createRange && window.getSelection) {
    range = document.createRange();
    sel = window.getSelection();
    sel.removeAllRanges();
    try {
      range.selectNodeContents(el);
      sel.addRange(range);
    } catch (e) {
      range.selectNode(el);
      sel.addRange(range);
    }
  } else if (body.createTextRange) {
    range = body.createTextRange();
    range.moveToElementText(el);
    range.select();
  }
  document.execCommand("Copy");
}

function graficaHabil(Id) {
  console.log(Id);
  let squad = $("#squadHabi option:selected").text();
  let iniciativa = $("#Hab_iniciativa option:selected").text();
  fetch(host + "/api/seguridad_def/controles_squad/grafica/todo/todo/" + Id, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + (localStorage.getItem("token") || ""),
    },
  })
    .then(function (response) {
      return response.text();
    })
    .then(function (data) {
      let datos = JSON.parse(data);

      console.log(datos);

      // Create the chart
      Highcharts.chart("container", {
        chart: {
          type: "pie",
          height: 620,
          backgroundColor: "#212a39",
        },
        title: {
          text: "[" + squad + "] : " + iniciativa,
          align: "center",
          style: {
            fontSize: "16px",
            fontFamily: "Arial",
            color: "#a4b1cd",
          },
        },
        subtitle: {
          useHTML: true,
          text: '<div id="habTotal80" class="sub80">80</div >',
          align: "center",
          verticalAlign: "middle",
          y: 45,
        },
        plotOptions: {
          series: {
            cursor: "pointer",
            point: {
              events: {
                click: function () {
                  let idIniciativa = $("#Hab_iniciativa option:selected").val();
                  renderDatatableHabi(idIniciativa + "/All/" + this.name);
                  $("#habiliCumpli").val(this.name);
                  $("#habiliImpre").val("All");
                },
              },
            },
          },
          pie: {
            allowPointSelect: true,
            cursor: "pointer",
            dataLabels: {
              useHTML: true,
              enabled: true,
              format:
                '<div class="formatoTextGra"> <span style="color:{point.color};">🞑 </span>{point.name}: {point.y:.0f}</div><div class="formatoTextGraPorce">{point.percentage:.1f} %</div>',
            },
            colors: [
              "#34ace0",
              "#706fd3",
              "#ff793f",
              "#33d9b2",
              "#d1ccc0",
              "#ff5252",
              "#ffda79",
            ],
          },
        },
        series: {
          borderRadius: 5,
          dataLabels: {
            //useHTML: true,
            enabled: true,
            format: "{name.y}: {point.y:.1f}",
          },
        },
        tooltip: {
          shared: true,
          useHTML: true,
          headerFormat: '<div style="font-size:14px">{series.name}</div><br>',
          pointFormat:
            '<div style="color:{point.color}; text-decoration:none;">{point.name}</div>: <b style="text-decoration:none;">{point.y:.0f}</b> of total<br/>',
        },
        series: [
          {
            name: "Cumplimiento",
            colorByPoint: true,
            innerSize: "50%",
            data: datos,
          },
        ],
      });
    });
}

function graficaHabilImpre(Id) {
  let squad = $("#squadHabi option:selected").text();
  let iniciativa = $("#Hab_iniciativa option:selected").text();
  fetch(
    host +
      "/api/seguridad_def/controles_squad/grafica/lite/imprescindible/" +
      Id,
  )
    .then(function (response) {
      return response.text();
    })
    .then(function (data) {
      let datos = JSON.parse(data);
      // Create the chart
      Highcharts.chart("container2", {
        chart: {
          type: "pie",
          height: 620,
          backgroundColor: "#212a39",
        },
        title: {
          text: "[" + squad + "] : " + iniciativa,
          align: "center",
          style: {
            fontSize: "16px",
            fontFamily: "Arial",
            color: "#a4b1cd",
          },
        },
        subtitle: {
          useHTML: true,
          text: '<div id="habTotal34" class="sub34">34</div >',
          align: "center",
          verticalAlign: "middle",
          y: 100,
          style: {
            fontSize: "77px",
          },
        },
        plotOptions: {
          series: {
            cursor: "pointer",
            point: {
              events: {
                click: function () {
                  let idIniciativa = $("#Hab_iniciativa option:selected").val();
                  renderDatatableHabi(idIniciativa + "/SI/" + this.name);
                  $("#habiliCumpli").val(this.name);
                  $("#habiliImpre").val("SI");
                },
              },
            },
          },
          pie: {
            allowPointSelect: true,
            cursor: "pointer",
            dataLabels: {
              useHTML: true,
              enabled: true,
              format:
                '<div class="formatoTextGra"> <span style="color:{point.color};">🞑 </span>{point.name}: {point.y:.0f}</div><div class="formatoTextGraPorce">{point.percentage:.1f} %</div>',
            },
            colors: [
              "#34ace0",
              "#706fd3",
              "#ff793f",
              "#33d9b2",
              "#d1ccc0",
              "#ff5252",
              "#ffda79",
            ],
          },
        },
        series: {
          borderRadius: 5,
          dataLabels: {
            enabled: true,
            format: "{name.y}: {point.y:.1f}",
          },
        },
        tooltip: {
          shared: true,
          useHTML: true,
          headerFormat:
            '<div style="font-size:14px; text-decoration:none !important;">{series.name}</div><br>',
          pointFormat:
            '<div style="text-decoration:none !important;">{point.name}</div>: <b style="text-decoration:none;">{point.y:.0f}</b> of total<br/>',
        },

        series: [
          {
            name: "Cumplimiento",
            colorByPoint: true,
            color: "red",
            innerSize: "50%",
            data: datos,
          },
        ],
      });
    });
}

$(document).on("click", ".sub80", function () {
  let idIniciativa = $("#Hab_iniciativa option:selected").val();
  let idInpreci = $("#habiliImpre option:selected").val();
  renderDatatableHabi(idIniciativa + "/" + idInpreci + "/Aplica");
  $("#habiliImpre").val("All");
  $("#habiliCumpli").val("Aplica");
});

$(document).on("click", ".sub34", function () {
  let idIniciativa = $("#Hab_iniciativa option:selected").val();
  let idInpreci = $("#habiliImpre option:selected").val();
  renderDatatableHabi(idIniciativa + "/SI/Aplica");
  $("#habiliImpre").val("SI");
  $("#habiliCumpli").val("Aplica");
});

$(document).on("click", "#agregarIniciativa", function () {
  $("#modalAddIniciativa").modal("show");
  $("#formAddIniciativa").trigger("reset");

  fetch(host + "/api/seguridad_def/combo/squads", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + (localStorage.getItem("token") || ""),
    },
  })
    .then(function (response) {
      return response.text();
    })
    .then(function (data) {
      let vulnerabilidades = JSON.parse(data);

      if (vulnerabilidades == "") {
        console.log("No hay data");
      } else {
        $(vulnerabilidades).each(function () {
          let option = $(document.createElement("option"));

          option.text(this.NombrePrin);
          option.val(this.IdPrin);
          $("#mAiId_Squad").append(option);
        });
      }
    });
});

function tablaGrafi(Id) {
  let squad = $("#squadHabi option:selected").text();
  let iniciativa = $("#Hab_iniciativa option:selected").text();
  fetch(host + "/api/seguridad_def/combo/squads/iniciativa/tabla/" + Id, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + (localStorage.getItem("token") || ""),
    },
  })
    .then(function (response) {
      return response.text();
    })
    .then(function (data) {
      /* let datos = JSON.parse(data);
            let nuevo = []

            datos.forEach(function (cumple) {
                let json = {}
                json[cumple.Cumplimiento] = cumple.Count;
                return nuevo.push(json)
            });
*/
      let datos = JSON.parse(data);
      let nuevo = {};
      datos.forEach(function (cumple) {
        return (nuevo[cumple.Cumplimiento.replace(" ", "_")] = cumple.Count);
      });

      if (nuevo.Si_Cumple > 0) {
        $("#cumpSiCumple").html(nuevo.Si_Cumple);
      } else $("#cumpSiCumple").html("0");

      if (nuevo.Cumple_Parcial > 0) {
        $("#cumpCumpleParcial").html(nuevo.Cumple_Parcial);
      } else $("#cumpCumpleParcial").html("0");

      if (nuevo.En_Progreso > 0) {
        $("#cumpEnProgre").html(nuevo.En_Progreso);
      } else $("#cumpEnProgre").html("0");

      if (nuevo.Dependencia > 0) {
        $("#cumpDependencia").html(nuevo.Dependencia);
      } else $("#cumpDependencia").html("0");

      if (nuevo.Falta_Evidencia > 0) {
        $("#cumpFaltaEvi").html(nuevo.Falta_Evidencia);
      } else $("#cumpFaltaEvi").html("0");

      if (nuevo.Con_Observaciones > 0) {
        $("#cumpConObser").html(nuevo.Con_Observaciones);
      } else $("#cumpConObser").html("0");

      if (nuevo.Otro > 0) {
        $("#cumpOtro").html(nuevo.Otro);
      } else $("#cumpOtro").html("0");

      if (nuevo.No_Cumple > 0) {
        $("#cumpNoCumple").html(nuevo.No_Cumple);
      } else $("#cumpNoCumple").html("0");
      /**/
      if (nuevo.No_Aplica > 0) {
        $("#cumpAplica").html(80 - nuevo.No_Aplica);
      } else $("#cumpAplica").html("0");

      if (nuevo.No_Aplica > 0) {
        $("#cumpNoAplica").html(nuevo.No_Aplica);
      } else $("#cumpNoAplica").html("0");

      $("#cumpSquad").html($("#squadHabi option:selected").text());
      $("#cumpIniciativa").html($("#Hab_iniciativa option:selected").text());
    });
}

function svg_textMultiline() {}

$("#testEtapa").click(function () {
  let iniciativa = $("#Hab_iniciativa option:selected").val();

  fetch(host + "/api/seguridad_def/habilitadores/etapa/" + iniciativa, {
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
      let habilitador = JSON.parse(data);

      habilitador.forEach(function (item, index) {
        $(".etaHab_" + item.HabSquad).hide();
        $(".etaHab_" + item.HabSquad + "_").hide();
        $("#etaHab_" + item.HabSquad + "_").hide();
      });
    });

  fetch(
    host + "/api/seguridad_def/habilitadores/etapa/cumplimiento/" + iniciativa,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (localStorage.getItem("token") || ""),
      },
    },
  )
    .then(function (response) {
      return response.text();
    })
    .then(function (data) {
      let habilitador = JSON.parse(data);
      habilitador.forEach(function (item, index) {
        if (item.EstadoHabSquad == "Si Cumple") {
          $(".etaHab_" + item.HabSquad).css({
            background: "#0c589d ",
          });
        } else if (item.EstadoHabSquad == "Cumple Parcial") {
          $(".etaHab_" + item.HabSquad).css({
            background: "linear-gradient(to left, #1a2332 50%, #2471a3 50%)",
          });
        } else if (item.EstadoHabSquad == "No Cumple") {
          $(".etaHab_" + item.HabSquad).css({
            background: "#91243e",
            color: "#00b0f3",
          });
        } else if (item.EstadoHabSquad == "Con Observaciones") {
          $(".etaHab_" + item.HabSquad).css({
            background: "#AD5D4E",
          });
        } else if (item.EstadoHabSquad == "Aplica") {
          $(".etaHab_" + item.HabSquad).css({
            background: "#293b56",
          });
        }

        $(".etaHab_" + item.HabSquad).attr("data-title", item.TituloHabSquad);
      });
    });

  let titulo2 = [
    {
      Id: "1",
      Titulo:
        "(1) Aplica si existe integración con terceros y salida de información en la iniciativa ",
    },
    {
      Id: "2",
      Titulo:
        "(2) Aplica si existe un componente de autenticación en la iniciativa ",
    },
    {
      Id: 3,
      Titulo: "(3) Aplica si el squad hace uso de VMs en producción ",
    },
    {
      Id: 4,
      Titulo: "(4) Aplica si el squad implementa microservicios ",
    },
    {
      Id: 5,
      Titulo: "(5) Aplica si el squad desarrolla aplicaciones móviles ",
    },
    {
      Id: 6,
      Titulo: "(6) Aplica si el squad utiliza usuarios genéricos ",
    },
    {
      Id: 7,
      Titulo:
        "(7) Aplica si algún miembro del squad tiene  rol Admin sobre algún portal expuesto en internet ",
    },
    {
      Id: 8,
      Titulo:
        "(8) Aplica si la aplicación tiene componente de login estándar o propio ",
    },
    {
      Id: 9,
      Titulo: "(9) Aplica si la iniciativa esta relacionada a mobile ",
    },
    {
      Id: 10,
      Titulo: "(10) Aplica para usuarios de servicio ",
    },
    {
      Id: 11,
      Titulo: "(11) Aplica a usuario privilegiados ",
    },
    {
      Id: 12,
      Titulo: "(12) Aplica cuando hay desarrollo backend y/o Frontend ",
    },
    {
      Id: 13,
      Titulo:
        "(13) Aplica  cuando se aplica los controles de seguridad dell Trike ",
    },
    {
      Id: 14,
      Titulo: "(14) Aplica para frontend ",
    },
  ];
  titulo2.forEach(function (item, index) {
    $("#etaHabTitu_" + item.Id).attr("data-title", item.Titulo);
  });
});

$(".habNum").click(function () {
  console.log($(this).attr("id"));
});

/*

const groupInfo = people.reduce((groups, person) => {
    const {
        A = 0, B = 0, C = 0
    } = groups;
    if (person.group === 'A') {
        return {
            ...groups,
            A: A + 1
        };
    } else if (person.group === 'B') {
        return {
            ...groups,
            B: B + 1
        };
    } else {
        return {
            ...groups,
            C: C + 1
        };
    }
}, {});



let data = rows;
data.forEach(function (item, index) {
    if (item.color === "Falta Evidencia") {
        item.color = '#909090';
    } else if (item.color === "Si Cumple") {
        item.color = '#2471a3';
    } else if (item.color === "No Aplica") {
        item.color = '#606060';
    } else if (item.color === "No Cumple") {
        item.color = '#91243e';
    } else if (item.color === "En Progreso") {
        item.color = '#ca6f1e';
    } else if (item.color === "Con Observaciones") {
        item.color = '#165274';
    } else if (item.color === "Dependencia") {
        item.color = '#d96465';
    } else {
        item.color = '#808080';
    }
});
*/

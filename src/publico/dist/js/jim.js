






























var li_items = document.querySelectorAll(".sidebar ul li");
var hamburger = document.querySelector(".hamburger");
var wrapper = document.querySelector(".wrapper");


li_items.forEach((li_item) => {
	li_item.addEventListener("mouseenter", () => {
		if (wrapper.classList.contains("click_collapse")) {
			return;
		}
		else {
			li_item.closest(".wrapper").classList.remove("hover_collapse");
		}
	})
})

li_items.forEach((li_item) => {
	li_item.addEventListener("mouseleave", () => {
		if (wrapper.classList.contains("click_collapse")) {
			return;
		}
		else {
			li_item.closest(".wrapper").classList.add("hover_collapse");
		}
	})
})



hamburger.addEventListener("click", () => {
	hamburger.closest(".wrapper").classList.toggle("click_collapse");
	hamburger.closest(".wrapper").classList.toggle("hover_collapse");
})


//Ampliar Pantalla
function menuCol7D() {


	let der = document.getElementById("menuDerecha").className = "col-7 pl-0 pr-1";
	let izq = document.getElementById("menuIzquierda").className = "col-5 pl-1 pr-0";

}

function menuCol5D() {


	let der = document.getElementById("menuDerecha").className = "col-5 pl-0 pr-1";
	let izq = document.getElementById("menuIzquierda").className = "col-7 pl-1 pr-0";

}

function menuColNormal() {
	let der = document.getElementById("menuDerecha").className = "col-6 pl-0 pr-1";
	let izq = document.getElementById("menuIzquierda").className = "col-6 pl-1 pr-0";


}
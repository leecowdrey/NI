function adjustLine(from, to, line) {
  var fT = from.offsetTop + from.offsetHeight / 2;
  var tT = to.offsetTop + to.offsetHeight / 2;
  var fL = from.offsetLeft + from.offsetWidth; // / 2;
  var tL = to.offsetLeft; // + to.offsetWidth / 2;

  var CA = Math.abs(tT - fT);
  var CO = Math.abs(tL - fL);
  var H = Math.sqrt(CA * CA + CO * CO);
  var ANG = (180 / Math.PI) * Math.acos(CA / H);

  if (tT > fT) {
    var top = (tT - fT) / 2 + fT;
  } else {
    var top = (fT - tT) / 2 + tT;
  }
  if (tL > fL) {
    var left = (tL - fL) / 2 + fL;
  } else {
    var left = (fL - tL) / 2 + tL;
  }

  if (
    (fT < tT && fL < tL) ||
    (tT < fT && tL < fL) ||
    (fT > tT && fL > tL) ||
    (tT > fT && tL > fL)
  ) {
    ANG *= -1;
  }
  top -= H / 2;

  line.style["-webkit-transform"] = "rotate(" + ANG + "deg)";
  line.style["-moz-transform"] = "rotate(" + ANG + "deg)";
  line.style["-ms-transform"] = "rotate(" + ANG + "deg)";
  line.style["-o-transform"] = "rotate(" + ANG + "deg)";
  line.style["-transform"] = "rotate(" + ANG + "deg)";
  line.style.top = top + "px";
  line.style.left = left + "px";
  line.style.height = H + "px";
}
adjustLine(
  document.getElementById("customer1"),
  document.getElementById("ingress1"),
  document.getElementById("customer1Cable1")
);
adjustLine(
  document.getElementById("customer1"),
  document.getElementById("ingress2"),
  document.getElementById("customer1Cable2")
);
adjustLine(
  document.getElementById("customer2"),
  document.getElementById("ingress3"),
  document.getElementById("customer2Cable1")
);
adjustLine(
  document.getElementById("customer2"),
  document.getElementById("ingress4"),
  document.getElementById("customer2Cable2")
);
adjustLine(
  document.getElementById("ingress1"),
  document.getElementById("ingress"),
  document.getElementById("ingressCable1")
);
adjustLine(
  document.getElementById("ingress2"),
  document.getElementById("ingress"),
  document.getElementById("ingressCable2")
);
adjustLine(
  document.getElementById("ingress3"),
  document.getElementById("ingress"),
  document.getElementById("ingressCable3")
);
adjustLine(
  document.getElementById("ingress4"),
  document.getElementById("ingress"),
  document.getElementById("ingressCable4")
);
adjustLine(
  document.getElementById("ingress"),
  document.getElementById("egress1"),
  document.getElementById("egressCable1")
);
adjustLine(
  document.getElementById("ingress"),
  document.getElementById("egress2"),
  document.getElementById("egressCable2")
);
adjustLine(
  document.getElementById("egress1"),
  document.getElementById("nextHop1"),
  document.getElementById("nextHopCable1")
);
adjustLine(
  document.getElementById("egress2"),
  document.getElementById("nextHop2"),
  document.getElementById("nextHopCable2")
);

// Nav Button Function
$( document ).ready(function() {

    $( ".btn-large" ).click(function() {
        var buttonVal = $(this).attr("id");
        $(".shown").addClass("hidden").removeClass("shown");
        $("#" + buttonVal + "Div").addClass("shown").removeClass("hidden");
      });
   

});
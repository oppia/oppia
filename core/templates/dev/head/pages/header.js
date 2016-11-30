$(window).on("load", function() {
    var banners = ["bannerA.svg", "bannerB.svg", "bannerC.svg", "bannerD.svg"];
    var version = Math.floor(Math.random() * 4);
    var bannerURL = "url(../../../../../assets/images/background/" + banners[version] + ")";
    $(".oppia-about-header").css("background-image", bannerURL);
});

$(document).ready (
	$('.bpost').click( function (e) {
		let title = $(this).attr('value')
		console.log(title)
		$.ajax({
			type: 'get',
			url: '/post',
			data: { postTitle: title }
			// success: function () {
			// 	window.location.href = "post.pug"
			// }
		})
	})
)
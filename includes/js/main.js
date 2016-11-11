$(document).ready ( function() {
	// $('#comment-list').hide()
	// ajax request to fetch comments of the post
	$.ajax( {
		type: 'get',
		url: '/showcomments',
		data: { title: document.getElementById('heading').innerHTML },
		success: function ( data ) {
			for (var i = data.length; i > 0; i--) {
				$( "<p>" + data[i-1] + "</p>" ).insertAfter( '#comment-list' )
			}
			// $('#comment-list').add('<div><p>Some textttt</p></div>')
		}
	})
	// $('#comment-submit').click( function (e) {
	// 	// let title = $(this).attr('value')
	// 	// console.log(title)
	// 	$.ajax({
	// 		type: 'get',
	// 		url: '/post',
	// 		data: { postTitle: title }
	// 		// success: function () {
	// 		// 	window.location.href = "post.pug"
	// 		// }
	// 	})
	// })
})
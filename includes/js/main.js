$(document).ready ( function() {
 	// send ajax request to load comments of a post
	$.ajax( {
		type: 'get',
		url: '/showcomments',
		data: { title: document.getElementById('heading').innerHTML },
		success: function ( data ) {
			for (var i = data.length; i > 0; i--) {
				$( "<p>" + data[i-1] + "</p>" ).insertAfter( '#comment-list' )
			}
		}
	})
	$('#comment-submit').click(function (e) {
		e.preventDefault()
		let comment = $('#hello').find('input[name="comment"]').val()
		$.ajax({
			type: 'post',
			url: '/addcomment',
			data: { comment: comment, 
				title: document.getElementById('heading').innerHTML 
			},
			success: function ( data ) {
				$( "<p>" + data.comment + "</p>").insertAfter( '#comment-list' )
			}
		})
	})
})
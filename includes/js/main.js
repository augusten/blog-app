$(document).ready ( function() {
 	// send ajax request to load comments of a post
	$.ajax( {
		type: 'get',
		url: '/showcomments',
		data: { title: document.getElementById('heading').innerHTML },
		success: function ( data ) {
			for (var i = data.length; i > 0; i--) {
				console.log(data[i-1])
				// need to upgrade to show user name, not number
				$( "<p>" + data[i-1].comText + "</p>" + "<p><i> - Comment by user #" + data[i-1].userId + "</p></i>" ).insertAfter( '#comment-list' )
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
				$( "<p>" + data.comment + "</p>" + "<p><i> - Comment by " + data.user.name + "</p></i>" ).insertAfter( '#comment-list' )
			}
		})
	})
})
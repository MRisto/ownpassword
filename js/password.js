/*******************
 **PasswordManager**
 ******************/

function PasswordManager() {
	var self = this;
	//passwordstrength options
	self.passwordstrengthoptions = {};
	self.passwordstrengthoptions.ui = {
		container : "#pwd-container",
		showVerdictsInsideProgressBar : true,
		viewports : {
			progress : ".pwstrength_viewport_progress"
		}
	};
	self.passwordstrengthoptions.common = {
		usernameField : '#passwordEdit-username',
		debug : true,
		onLoad : function() {
			$('#messages').text('Start typing password');
		}
	};

	self.passwordstrengthoptions.rules = {
		activated : {
			wordTwoCharacterClasses : true,
			wordRepetitions : true
		}
	};

	//Variables
	self.ajaxPasswordManagerUrl = scriptPath + "ajax/PasswordManager.php";
	self.passwordHideContent = "****";
	console.log(self.ajaxPasswordManagerUrl);
	self.userToken = $('#user-token').val();

	/*************************
	 *PasswordManager Folders*
	 ************************/

	//get the folders from the database if the argument selectedToken is given, then the folder with the token gets active
	self.getFolders = function(folderToken) {
		$.ajax({
			method : "POST",
			url : self.ajaxPasswordManagerUrl,
			data : {
				action : "getFolders",
				userToken : self.userToken
			}
		}).done(function(jsonObj) {
			$("#folders").html("");
			var obj = JSON.parse(jsonObj);
			for (var i = 0; i < obj.length; i++) {
				//$("#folders").append('<li class="folder" onclick="getPasswords(\'' + obj[i].token_id + '\')">' + obj[i].name + '</li>');
				$('<li class="mouse-cursor-pointer">' + obj[i].name + '</li>').appendTo("#folders").addClass("folder").attr("data-folder-token-id", obj[i].token_id).click(function() {

					self.openFolder($(this));
				});
			}
			//if he gets a folderToken then he sets it as active and load the passwords from the folder
			if (folderToken) {
				$("[data-folder-token-id=" + folderToken + "]").addClass("active");
				self.showPasswordList(folderToken);
			}

		});
	};

	//clears the ModalFolderEdit values
	self.clearFolderEditValues = function() {
		$('#folderEdit-title').val("");
		$('#folderEdit-token').val("");
	};

	//creates a folder -> databaseinsert
	self.createFolder = function() {
		//Hide the delete button, because we want to create not delete
		$('.btn-folderEdit-delete').hide();
		//show the modal
		$('#folderEditModal').modal('show');
		//remove old click listeners
		$('.btn-folderEdit-save').unbind("click");
		//add new clicklisteners
		$('.btn-folderEdit-save').click(function() {
			$.ajax({
				method : "POST",
				url : self.ajaxPasswordManagerUrl,
				data : {
					action : "createFolder",
					userToken : self.userToken,
					title : $('#folderEdit-title').val()
				}
			}).done(function(jsonObj) {
				//update PasswordList after update
				console.log("ADDED Folder");
				//update the folder list and set the new folder as active
				var obj = JSON.parse(jsonObj);
				self.getFolders(obj);
				$('#folderEditModal').modal('hide');
			});

		});
	};

	//updates new folder settings to the db
	self.updateFolder = function() {
		//get the folder values
		$('#folderEdit-title').val($('.folder.active').html());
		$('#folderEdit-token').val($('.folder.active').attr("data-folder-token-id"));
		$('#folderEditModal').modal('show');
		//remove old clicklisteners
		$('.btn-folderEdit-save').unbind("click");
		$('.btn-folderEdit-delete').unbind("click");
		//add save click listener
		$('.btn-folderEdit-save').click(function() {
			$.ajax({
				method : "POST",
				url : self.ajaxPasswordManagerUrl,
				data : {
					action : "updateFolder",
					userToken : self.userToken,
					folderToken : $("#folderEdit-token").val(),
					title : $('#folderEdit-title').val()
				}
			}).done(function(jsonObj) {
				console.log("UPDATED Folder");
				//update PasswordList after update
				var tokenId = $("#folderEdit-token").val();
				self.getFolders(tokenId);
				$('#folderEditModal').modal('hide');
			});
		});
		//add delete click listener
		$('.btn-folderEdit-delete').click(function() {
			$.ajax({
				method : "POST",
				url : self.ajaxPasswordManagerUrl,
				data : {
					action : "deleteFolder",
					userToken : self.userToken,
					folderToken : $("#folderEdit-token").val()
				}
			}).done(function(jsonObj) {
				console.log("DELETED Folder");
				//get folder with default value
				self.getFoldersWithDefault();
				$('#folderEditModal').modal('hide');
			});
		});
	};

	//get the folder list with the default folder selected
	self.getFoldersWithDefault = function() {
		$.ajax({
			method : "POST",
			url : self.ajaxPasswordManagerUrl,
			data : {
				action : "getDefaultFolder",
				userToken : self.userToken
			}
		}).done(function(jsonObj) {
			//if there are folders
			if (jsonObj != 'null') {
				var obj = JSON.parse(jsonObj);
				self.getFolders(obj.token_id);
				//load passwords from the selected default folder
				self.showPasswordList(obj.token_id);
			}

		});
	};
	/*
	 * shows the Password List from the Folder in the #password-content
	 */
	self.showPasswordList = function(folderToken) {
		$.ajax({
			method : "POST",
			url : self.ajaxPasswordManagerUrl,
			data : {
				action : "getPasswords",
				folderToken : folderToken,
				userToken : self.userToken
			}
		}).done(function(jsonObj) {
			$("#password-content").html("");
			if (jsonObj) {
				var obj = JSON.parse(jsonObj);
				for (var i = 0; i < obj.length; i++) {
					$("#password-content").append('<tr id="passwordParentInChange"><td>' + obj[i].title + '</td><td>' + obj[i].username + '</td><td id="passwordInChange"><span class="password-content">' + self.passwordHideContent + '</span> <span class="glyphicon glyphicon-eye-open mouse-cursor-pointer" aria-hidden="true"></span></td><td id="passwordEditInChange"><span class="glyphicon glyphicon-pencil mouse-cursor-pointer" aria-hidden="true"></span></td></tr>');
					$('#passwordInChange').addClass("password").click(function() {

						self.showPassword($(this));
					}).removeAttr('id');
					$('#passwordParentInChange').attr("data-password-token-id", obj[i].token_id).removeAttr('id');
					$('#passwordEditInChange').click(function() {

						self.updatePassword($(this));
					}).removeAttr('id');
				}
			}
		});
	};

	//open a folder and shows the passwords inside
	self.openFolder = function(folder) {
		//open the folder
		$(".folder").removeClass("active");
		folder.addClass("active");
		//shows passwords
		self.showPasswordList(folder.attr("data-folder-token-id"));
	};

	/***************************
	 *PasswordManager Passwords*
	 **************************/

	//show  the password
	self.showPassword = function(callingItem) {
		self.getPasswordData(callingItem, function(obj) {

			callingItem.find(".password-content").html(obj.password);

			//hide password after 5 sec
			setTimeout(function() {
				callingItem.find(".password-content").html(self.passwordHideContent);
			}, 5000);
		});
	};

	//get the passwordData
	self.getPasswordData = function(callingItem, calledFunction) {
		$.ajax({
			method : "POST",
			url : self.ajaxPasswordManagerUrl,
			data : {
				action : "getPasswordData",
				userToken : self.userToken,
				passwordToken : callingItem.parent().attr("data-password-token-id")
			}
		}).done(function(jsonObj) {
			var obj = JSON.parse(jsonObj);
			calledFunction(obj);
		});
	};

	//clear the passwordEdit values
	self.clearPasswordEditValues = function() {
		$('#passwordEdit-title').val("");
		$('#passwordEdit-username').val("");
		$('#passwordEdit-password').val("");
		$('#passwordEdit-token').val("");
		$("#passwdfield").pwstrength("destroy");
	};

	//update the password in the database
	self.updatePassword = function(callingItem) {
		//unbind the click events
		$('.btn-passwordEdit-save').unbind("click");
		$('.btn-passwordEdit-delete').unbind("click");

		self.getPasswordData(callingItem, function(obj) {
			$('#passwordEditModal').modal('show');
			$('#passwordEdit-title').val(obj.title);
			$('#passwordEdit-username').val(obj.username);
			$('#passwordEdit-password').val(obj.password);
			$('#passwordEdit-token').val(callingItem.parent().attr("data-password-token-id"));

			//passwordStrength


			$('#passwordEdit-password').pwstrength(self.passwordstrengthoptions);

			//when click on save
			$('.btn-passwordEdit-save').click(function() {
				$.ajax({
					method : "POST",
					url : self.ajaxPasswordManagerUrl,
					data : {
						action : "updatePassword",
						userToken : self.userToken,
						passwordToken : $('#passwordEdit-token').val(),
						title : $('#passwordEdit-title').val(),
						username : $('#passwordEdit-username').val(),
						password : $('#passwordEdit-password').val()
					}
				}).done(function(jsonObj) {
					console.log("EDITED PASSWORD");
					//update PasswordList after update
					self.openFolder($('.folder.active'));
					$('#passwordEditModal').modal('hide');

				});

			});
			//when click on delete
			$('.btn-passwordEdit-delete').click(function() {
				$.ajax({
					method : "POST",
					url : self.ajaxPasswordManagerUrl,
					data : {
						action : "deletePassword",
						userToken : self.userToken,
						passwordToken : $('#passwordEdit-token').val()
					}
				}).done(function(jsonObj) {
					console.log("DELETED PASSWORD");
					//update PasswordList after delet
					self.openFolder($('.folder.active'));
					$('#passwordEditModal').modal('hide');

				});

			});

		});

	};

	self.createPassword = function() {
		$('.btn-passwordEdit-delete').hide();
		$('#passwordEditModal').modal('show');
		//REMOVE OLD CLICK LISTENER
		$('.btn-passwordEdit-save').unbind("click");
		//WHEN CLICK ON SAVE
		$('.btn-passwordEdit-save').click(function() {
			$.ajax({
				method : "POST",
				url : self.ajaxPasswordManagerUrl,
				data : {
					action : "createPassword",
					userToken : $("#user-token").val(),
					title : $('#passwordEdit-title').val(),
					folderToken : $('.folder.active').attr("data-folder-token-id"),
					username : $('#passwordEdit-username').val(),
					password : $('#passwordEdit-password').val()
				}
			}).done(function(jsonObj) {
				//update PasswordList after update
				console.log("ADDED PASSWORDs");
				//updates passworddata
				self.openFolder($('.folder.active'));

				$('#passwordEditModal').modal('hide');
			});

		});

	};
}

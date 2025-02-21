document.addEventListener('DOMContentLoaded', () => {
  // Global array for selected attachments
  let selectedAttachments = [];

  const form = document.getElementById('chat-form');
  const conversation = document.getElementById('conversation');
  const previewsContainer = document.getElementById('previews');
  const textInput = document.getElementById('text-input');
  const sendButton = document.querySelector('.send-button');

  // Paperclip (attachment) button & dropdown
  const attachmentBtn = document.getElementById('attachment-btn');
  const attachmentDropdown = document.getElementById('attachment-dropdown');

  attachmentBtn.addEventListener('click', () => {
    if (attachmentDropdown.style.display === 'none' || attachmentDropdown.style.display === '') {
      attachmentDropdown.style.display = 'block';
    } else {
      attachmentDropdown.style.display = 'none';
    }
  });

  // Hide dropdown if user clicks outside
  document.addEventListener('click', (e) => {
    if (!attachmentBtn.contains(e.target) && !attachmentDropdown.contains(e.target)) {
      attachmentDropdown.style.display = 'none';
    }
  });

  // Auto-resize for textarea (up to 5 lines)
  textInput.addEventListener('input', autoResizeTextarea);

  function autoResizeTextarea() {
    const lineHeight = parseInt(window.getComputedStyle(textInput).lineHeight) || 20;
    const maxLines = 5;
    const maxHeight = lineHeight * maxLines;
    textInput.style.height = 'auto'; // reset to measure

    if (textInput.scrollHeight <= maxHeight) {
      textInput.style.overflowY = 'hidden';
      textInput.style.height = textInput.scrollHeight + 'px';
    } else {
      textInput.style.overflowY = 'auto';
      textInput.style.height = maxHeight + 'px';
    }
  }

  // Different ENTER behavior based on screen size
  textInput.addEventListener('keydown', (e) => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      if (e.key === 'Enter') {
        e.stopPropagation();
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    }
  });

  // Helper: unique ID for each preview
  function createUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
  }

  // IMAGE input
  document.getElementById('image-input').addEventListener('change', function (e) {
    const files = e.target.files;
    if (files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        const uniqueId = createUniqueId();
        reader.onload = function (evt) {
          const previewDiv = document.createElement('div');
          previewDiv.classList.add('preview');
          previewDiv.id = uniqueId;

          const removeBtn = document.createElement('button');
          removeBtn.classList.add('remove-preview');
          removeBtn.type = 'button';
          removeBtn.innerHTML = '&times;';
          removeBtn.setAttribute('data-id', uniqueId);
          previewDiv.appendChild(removeBtn);

          const img = document.createElement('img');
          img.classList.add('preview-thumb');
          img.src = evt.target.result;
          previewDiv.appendChild(img);

          previewsContainer.appendChild(previewDiv);

          selectedAttachments.push({
            id: uniqueId,
            type: 'image',
            file: file,
            preview: evt.target.result
          });
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    }
  });

  // AUDIO input
  document.getElementById('audio-input').addEventListener('change', function (e) {
    const files = e.target.files;
    if (files.length > 0) {
      Array.from(files).forEach(file => {
        const uniqueId = createUniqueId();
        const previewDiv = document.createElement('div');
        previewDiv.classList.add('preview');
        previewDiv.id = uniqueId;

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-preview');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '&times;';
        removeBtn.setAttribute('data-id', uniqueId);
        previewDiv.appendChild(removeBtn);

        const audioIcon = document.createElement('div');
        audioIcon.classList.add('audio-preview');
        audioIcon.innerHTML = '<i class="fas fa-microphone"></i>';
        previewDiv.appendChild(audioIcon);

        previewsContainer.appendChild(previewDiv);

        selectedAttachments.push({
          id: uniqueId,
          type: 'audio',
          file: file
        });
      });
      e.target.value = '';
    }
  });

  // *** Disable Video Attachment Button - Coming Soon 🚧 ***
  const videoInput = document.getElementById('video-input');
  videoInput.disabled = true; // Disable video file input

  // Modify the video label to indicate "Coming soon"
  const videoLabel = document.querySelector('label[for="video-input"]');
  if (videoLabel) {
    videoLabel.setAttribute('title', 'Coming soon');
    videoLabel.style.cursor = 'not-allowed';
  }

  // (Optional) Comment out or remove the video input event listener as it's not needed.
  /*
  document.getElementById('video-input').addEventListener('change', function (e) {
    const files = e.target.files;
    if (files.length > 0) {
      Array.from(files).forEach(file => {
        const uniqueId = createUniqueId();
        const previewDiv = document.createElement('div');
        previewDiv.classList.add('preview');
        previewDiv.id = uniqueId;

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-preview');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '&times;';
        removeBtn.setAttribute('data-id', uniqueId);
        previewDiv.appendChild(removeBtn);

        const videoIcon = document.createElement('div');
        videoIcon.classList.add('video-preview');
        videoIcon.innerHTML = '<i class="fas fa-video"></i>';
        previewDiv.appendChild(videoIcon);

        previewsContainer.appendChild(previewDiv);

        selectedAttachments.push({
          id: uniqueId,
          type: 'video',
          file: file
        });
      });
      e.target.value = '';
    }
  });
  */

  // Remove Previews (event delegation)
  previewsContainer.addEventListener('click', function (e) {
    if (e.target.classList.contains('remove-preview')) {
      const idToRemove = e.target.getAttribute('data-id');
      selectedAttachments = selectedAttachments.filter(item => item.id !== idToRemove);
      const previewElem = document.getElementById(idToRemove);
      if (previewElem) {
        previewsContainer.removeChild(previewElem);
      }
    }
  });

  // Helper: Highlight code blocks using highlight.js 🚀
  function highlightCodeBlocks(container) {
    const codeBlocks = container.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
      if (window.hljs) {
        hljs.highlightElement(block);
      }
    });
  }

  // FORM SUBMISSION
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = textInput.value;

    // Disable textarea & send button
    textInput.disabled = true;
    sendButton.disabled = true;

    // Create user message
    const userMessageContainer = document.createElement('div');
    userMessageContainer.classList.add('message', 'user');

    if (selectedAttachments.length > 0) {
      const attachmentBox = document.createElement('div');
      attachmentBox.classList.add('attachment-box');

      selectedAttachments.forEach(attachment => {
        const attachmentItem = document.createElement('div');
        attachmentItem.classList.add('attachment-item');

        if (attachment.type === 'image') {
          const img = document.createElement('img');
          img.classList.add('attachment-thumb');
          img.src = attachment.preview;
          attachmentItem.appendChild(img);
        } else if (attachment.type === 'audio') {
          const audioDiv = document.createElement('div');
          audioDiv.classList.add('attachment-audio');
          audioDiv.innerHTML = '<i class="fas fa-microphone"></i>';
          attachmentItem.appendChild(audioDiv);
        } else if (attachment.type === 'video') {
          const videoDiv = document.createElement('div');
          videoDiv.classList.add('attachment-video');
          videoDiv.innerHTML = '<i class="fas fa-video"></i>';
          attachmentItem.appendChild(videoDiv);
        }
        attachmentBox.appendChild(attachmentItem);
      });
      userMessageContainer.appendChild(attachmentBox);
    }

    const messageText = document.createElement('div');
    messageText.classList.add('message-text');

    const userIcon = document.createElement('img');
    userIcon.src = '/static/images/user.png';
    userIcon.width = 30;
    userIcon.height = 30;
    userIcon.classList.add('user-icon');
    userIcon.alt = 'User Icon';
    messageText.appendChild(userIcon);
    messageText.appendChild(document.createElement('br'));

    const textNode = document.createTextNode(text);
    messageText.appendChild(textNode);
    userMessageContainer.appendChild(messageText);

    conversation.appendChild(userMessageContainer);

    // Build FormData
    const formData = new FormData();
    formData.append('text', text);
    selectedAttachments.forEach(attachment => {
      if (attachment.type === 'image') {
        formData.append('image', attachment.file);
      } else if (attachment.type === 'audio') {
        formData.append('audio', attachment.file);
      } else if (attachment.type === 'video') {
        formData.append('video', attachment.file);
      }
    });

    // Clear textarea & previews
    textInput.value = '';
    selectedAttachments = [];
    previewsContainer.innerHTML = '';
    textInput.style.height = 'auto';
    textInput.style.overflowY = 'hidden';

    // Show AI typing spinner
    const aiTyping = document.createElement('div');
    aiTyping.classList.add('message', 'ai');
    aiTyping.innerHTML = `
      <img src="/static/images/ai.png" width="30" height="30" class="ai-icon" alt="AI Icon">
      <div class="spinner"></div>
    `;
    conversation.appendChild(aiTyping);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      // Remove the spinner
      aiTyping.remove();

      // Create final AI message with the server's response (which might include code blocks)
      const aiMessage = document.createElement('div');
      aiMessage.classList.add('message', 'ai');
      aiMessage.innerHTML = `
        <img src="/static/images/ai.png" width="30" height="30" class="ai-icon" alt="AI Icon">
        ${data.response}
      `;
      conversation.appendChild(aiMessage);

      // Highlight any code blocks inside the AI message 🚀
      highlightCodeBlocks(aiMessage);

      // Re-enable textarea & send button
      textInput.disabled = false;
      sendButton.disabled = false;
      autoResizeTextarea();

      // Scroll to bottom
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error:', error);
      aiTyping.remove();
      textInput.disabled = false;
      sendButton.disabled = false;
    }
  });
});

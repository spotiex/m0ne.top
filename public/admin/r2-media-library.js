(function () {
  async function getIdentityToken() {
    if (!window.netlifyIdentity) return '';
    const user = window.netlifyIdentity.currentUser();
    if (!user || typeof user.jwt !== 'function') return '';
    try {
      return await user.jwt();
    } catch (_) {
      return '';
    }
  }

  async function uploadToR2(file, options) {
    const formData = new FormData();
    formData.append('file', file);
    if (options.path) {
      formData.append('path', options.path);
    }

    const token = await getIdentityToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(options.upload_endpoint || '/api/admin/r2-upload', {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'same-origin'
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Upload failed (${response.status})`);
    }

    const payload = await response.json();
    if (!payload || typeof payload.url !== 'string') {
      throw new Error('Upload endpoint returned an invalid payload');
    }

    return payload.url;
  }

  function registerR2MediaLibrary(CMS) {
    CMS.registerMediaLibrary({
      name: 'r2',
      init({ options, handleInsert }) {
        this.options = options || {};
        this.handleInsert = handleInsert;
      },
      show({ allowMultiple = false }) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = this.options.accept || 'image/*';
        input.multiple = Boolean(allowMultiple);

        input.addEventListener('change', async () => {
          const files = Array.from(input.files || []);
          if (!files.length) return;

          const maxSizeMb = Number(this.options.max_size_mb || 15);
          const oversized = files.find((file) => file.size > maxSizeMb * 1024 * 1024);
          if (oversized) {
            window.alert(`File "${oversized.name}" exceeds ${maxSizeMb}MB.`);
            return;
          }

          try {
            const uploaded = [];
            for (const file of files) {
              uploaded.push(await uploadToR2(file, this.options));
            }
            this.handleInsert(allowMultiple ? uploaded : uploaded[0]);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown upload error';
            window.alert(`R2 upload failed: ${message}`);
          }
        });

        input.click();
      },
      hide() {},
      enableStandalone() {
        return false;
      }
    });
  }

  window.registerR2MediaLibrary = registerR2MediaLibrary;
})();

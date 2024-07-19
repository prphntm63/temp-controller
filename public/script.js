$( document ).ready(function() {
  const socket = io()

  socket.on('currentData', (msg) => {
    if (!msg) {
      return
    }

    $('#ferm1 > .temp').text(msg.ferm1.current_temp?.toFixed(2) + "°F")
    $('#ferm1 > .set').text((msg.ferm1?.set_temp?.toFixed(1) || "-") + "°F")
    if (msg.ferm1.status === 'heat') {
      $('#ferm1 > .set').css('color', 'red')
    } else if (msg.ferm1.status === 'cool') {
      $('#ferm1 > .set').css('color', 'turquoise')
    } else {
      $('#ferm1 > .set').css('color', 'white')
    }

    $('#ferm2 > .temp').text(msg.ferm2.current_temp?.toFixed(2) + "°F")
    $('#ferm2 > .set').text((msg.ferm2?.set_temp?.toFixed(1) || "-") + "°F")
    if (msg.ferm2.status === 'heat') {
      $('#ferm2 > .set').css('color', 'red')
    } else if (msg.ferm2.status === 'cool') {
      $('#ferm2 > .set').css('color', 'turquoise')
    } else {
      $('#ferm2 > .set').css('color', 'white')
    }
  })

  if ($('.ferm-update').length > 0) {
    // If this is the case, we are on the update page
    const updateFields = (deviceId, config) => {
      if (!config) {
        return
      }
      const device = $(`#${deviceId}`)

      device.find('.name').val(config.name)
      device.find('.url').val(config.url)
      device.find('.set_temp').val(config.set_temp)
      device.find('.threshold').val(config.threshold)
      device.find('.og').val(config.og)
      device.find('.fg').val(config.fg)
      device.find('.tare').text(config.tare?.toFixed(6) || '-')
      device.find('.full').text(config.full?.toFixed(6) || '-')
    }

    // Preload data into fields
    fetch('/config')
      .then(res => res.json())
      .then(data => {
        ['ferm1', 'ferm2'].forEach(deviceId => {
          updateFields(deviceId, data[deviceId])
        })
      })

    $('.update').click(function(evt) {
      const device = $(this).closest('.ferm-update')
  
      fetch('/config', {
        method: 'POST',
        body: JSON.stringify({
          device_id: device.attr('id'),
          name: device.find('.name').val(),
          url: device.find('.url').val(),
          set_temp: Number(device.find('.set_temp').val()) || null,
          threshold: Number(device.find('.threshold').val()) || null,
          og: Number(device.find('.og').val()) || null,
          fg: Number(device.find('.fg').val()) || null,
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then((config) => {
          console.log(config)
          updateFields(device.attr('id'), config)
          window.alert(`Updated ${device.attr('id')} Successfully`)
        })
        .catch(err => {
          window.alert(`Failure updating ${device.attr('id')}: ${JSON.stringify(err)}`)
        })
    })
  
    $('.setTare').click(function(evt) {
      const device_id = $(this).closest('.ferm-update').attr('id')
      console.log(device_id)
  
      fetch('/tare', {
        method: 'POST',
        body: JSON.stringify({
          device_id,
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then((config) => {
          console.log(config)
          updateFields(device_id, config)
          window.alert(`Tared ${device_id} Successfully`)
        })
        .catch(err => {
          window.alert(`Failure taring ${device_id}: ${JSON.stringify(err)}`)
        })
    })
  
    $('.setFull').click(function(evt) {
      const device_id = $(this).closest('.ferm-update').attr('id')
  
      fetch('/full', {
        method: 'POST',
        body: JSON.stringify({
          device_id,
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then((config) => {
          console.log(config)
          updateFields(device_id, config)
          window.alert(`Set ${device_id} as Full Successfully`)
        })
        .catch(err => {
          window.alert(`Failure setting full ${device_id}: ${JSON.stringify(err)}`)
        })
    })
  }
});
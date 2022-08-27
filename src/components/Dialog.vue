<!--
  - @copyright 2022 Christopher Ng <chrng8@gmail.com>
  -
  - @author Christopher Ng <chrng8@gmail.com>
  -
  - @license AGPL-3.0-or-later
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
-->

<template>
  <NcModal :id="dialogId"
    class="dialog"
    size="small"
    @close="close">
    <div class="dialog__container">
      <h2 class="dialog__title">{{ titleText }}</h2>
      <p>{{ subtitleText }}</p>

      <NcPasswordField ref="field"
        :value.sync="password"
        :label="passwordLabelText"
        :check-password-strength="true"
        @valid="valid = true"
        @invalid="valid = false"
        @keydown.enter="confirm" />

      <NcNoteCard v-if="errorMessage"
        :show-alert="true">
        <p>{{ errorMessage }}</p>
      </NcNoteCard>

      <NcButton type="primary"
        class="dialog__button"
        :aria-label="confirmText"
        :disabled="!valid"
        @click="confirm">
        {{ confirmText }}
      </NcButton>
    </div>
  </NcModal>
</template>

<script lang="ts">
import Vue from 'vue'
import axios from '@nextcloud/axios'
import { NcButton, NcModal, NcNoteCard, NcPasswordField } from '@nextcloud/vue'
import { getCapabilities } from '@nextcloud/capabilities'
import { generateUrl } from '@nextcloud/router'
import { DIALOG_ID } from '../globals.js'
import { t } from '../utils/l10n.js'

import type { ComponentInstance } from 'vue'

export default Vue.extend({
  name: 'Dialog',

  components: {
    NcButton,
    NcModal,
    NcNoteCard,
    NcPasswordField,
  },

  data() {
    return {
      password: '',
      errorMessage: '',
      valid: Boolean((getCapabilities() as any)?.password_policy) ? false : true,
      dialogId: DIALOG_ID,
      titleText: t('Authentication required'),
      subtitleText: t('This action requires you to confirm your password'),
      passwordLabelText: t('Password'),
      confirmText: t('Confirm'),
    }
  },

  mounted() {
    this.$nextTick(() => {
      ;((this.$refs.field as ComponentInstance).$el.querySelector('input[type="password"]') as HTMLInputElement).focus()
    })
  },

  methods: {
    async confirm(): Promise<void> {
      const url = generateUrl('/login/confirm')
      try {
        const { data } = await axios.post(url, { password: this.password })
        window.nc_lastLogin = data.lastLogin
        this.errorMessage = ''
        this.$emit('confirmed')
      } catch (e) {
        this.errorMessage = t('Failed to authenticate, try again')
      }
    },

    close(): void {
      this.$emit('close')
    },
  },
})
</script>

<style lang="scss" scoped>
.dialog {
  &__container {
    display: flex;
    flex-direction: column;
    margin: 30px;
    gap: 10px 0;
  }

  &__title {
    margin-bottom: 0;
  }

  &__button {
    margin-top: 6px;
    align-self: flex-end;
  }
}
</style>

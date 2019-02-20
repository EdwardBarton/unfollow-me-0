<template>
  <div class="home">
    <button v-if="Object.keys(user).length === 0" @click="startAuth">
      Twitter Auth
    </button>
    <div v-else>
      <h1>{{ user.displayName }}</h1>
      <div class="friends-list" v-show="user.friendsToUnfollow.length > 0">
        <div class="friend" v-for="f in user.friendsToUnfollow" :key="f.id">
          <img :src="f.profile_image_url" :alt="f.name" />
          <h3>{{ f.name }}</h3>
          <button>Unfollow</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import io from "socket.io-client";
const API_URL = "http://127.0.0.1:8001";
const socket = io(API_URL);

export default {
  data() {
    return {
      popup: null,
      disabled: ""
    };
  },
  mounted() {
    socket.on("user", user => {
      this.popup.close();
      this.$store.state.user = user;
    });
  },
  computed: mapState({
    user: "user"
  }),
  methods: {
    checkPopup() {
      const check = setInterval(() => {
        const { popup } = this;
        if (!popup || popup.closed || popup.closed === undefined) {
          clearInterval(check);
          this.disabled = "";
        }
      }, 1000);
    },
    openPopup() {
      const width = 600;
      const height = 600;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;

      const url = `${API_URL}/api/auth/twitter?socketId=${socket.ids}`;

      return window.open(
        url,
        "",
        `toolbar=no, location=no, directories=no, status=no, menubar=no, 
      scrollbars=no, resizable=no, copyhistory=no, width=${width}, 
      height=${height}, top=${top}, left=${left}`
      );
    },
    startAuth() {
      if (!this.disabled) {
        this.popup = this.openPopup();
        this.checkPopup();
        this.disabled = "disabled";
      }
    }
  }
};
</script>

<style scope>
.friends-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.friend {
  text-align: center;
  padding-top: 25px;
  height: 200px;
  width: 150px;
  border: 1px solid black;
  margin: 10px 0;
}

img {
  border-radius: 50%;
}
</style>
